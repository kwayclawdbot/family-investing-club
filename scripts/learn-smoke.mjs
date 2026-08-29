/**
 * Lane LEARN smoke — exercises `src/lib/live/learning.ts`, `src/lib/learn/**`, `src/app/api/learn/**`
 * and `/api/practice/order` against the live FTA project AS the seeded member (magic-link session,
 * same pattern as scripts/identity-smoke.mjs), so RLS is really tested.
 *
 * Reads replicate each reader's exact column list (a renamed column fails here, not in production).
 * Writes go to rows this script creates and are removed again in the cleanup phase; nothing that
 * existed before the run is modified. The pure step parser (`src/lib/learn/schema.ts`) is imported
 * and run against real `lessons.steps` JSON via Node's type stripping.
 *
 *   node scripts/learn-smoke.mjs            # kcoffie90@gmail.com
 *   SMOKE_EMAIL=kid@example.com node scripts/learn-smoke.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { parseLessonSteps, deriveRegister, LEARN_XP, QUIZ_PASS_PCT } from "../src/lib/learn/schema.ts";
import { resolveLegacyVideoId } from "../src/lib/learn/legacy.ts";

/* ── session ───────────────────────────────────────────────────────── */
const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SMOKE_EMAIL ?? "kcoffie90@gmail.com";

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const { data: link, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
if (le) { console.error("generateLink failed:", le.message); process.exit(1); }
const u = createClient(URL_, ANON, { auth: { persistSession: false } });
const { data: sess, error: ve } = await u.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
if (ve || !sess?.session) { console.error("verifyOtp failed:", ve?.message); process.exit(1); }
const uid = sess.user.id;
const { data: me } = await u.from("profiles").select("id, role, age_group, comprehension_level, family_id").eq("id", uid).maybeSingle();
console.log(`LEARN smoke — ${EMAIL} (${uid.slice(0, 8)}) role=${me?.role} age_group=${me?.age_group}\n`);

/* ── harness ───────────────────────────────────────────────────────── */
let pass = 0, fail = 0;
const cleanups = [];      // async fns run in reverse at the end
const leftBehind = [];    // things we could NOT clean up
async function check(name, fn) {
  try {
    const note = await fn();
    pass++; console.log(`PASS  ${name}${note ? ` — ${note}` : ""}`);
  } catch (e) {
    fail++; console.log(`FAIL  ${name} — ${e?.message ?? e}`);
  }
}
const ensure = (cond, msg) => { if (!cond) throw new Error(msg); };
const err = (res, what) => { if (res.error) throw new Error(`${what}: ${res.error.code ?? ""} ${res.error.message}`); return res.data; };

/* ── 1. curriculum: courses → modules → lessons (+ progress) ───────── */
let curriculum = null;
await check("courses → modules → lessons load with progress", async () => {
  const courses = err(await u.from("courses").select("id, slug, title, description, program, published, sort_order, min_tier").eq("published", true).order("sort_order"), "courses");
  ensure(courses.length, "no published courses visible");
  const modules = err(await u.from("modules").select("id, course_id, title, description, sort_order").in("course_id", courses.map((c) => c.id)).order("sort_order"), "modules");
  ensure(modules.length, "no modules visible");
  const lessons = err(await u.from("lessons").select("id, module_id, title, est_minutes, lesson_xp, node_kind, sort_order, retired, has_quiz, is_free, video_duration_sec").in("module_id", modules.map((m) => m.id)).order("sort_order"), "lessons").filter((l) => !l.retired);
  ensure(lessons.length, "no live lessons visible");
  const progress = err(await u.from("lesson_progress").select("lesson_id, status, progress_pct").eq("user_id", uid), "lesson_progress");
  const stepped = err(await u.from("lessons").select("id").not("steps", "is", null), "lessons.steps");
  curriculum = { courses, modules, lessons, progress, stepped: new Set(stepped.map((r) => r.id)) };
  return `${courses.length} courses · ${modules.length} modules · ${lessons.length} lessons · ${progress.length} progress rows · ${stepped.length} stepped`;
});

/* ── 2. one stepped lesson resolves through the real parser ────────── */
await check("stepped lesson (lessons.steps) resolves via parseLessonSteps", async () => {
  const rows = err(await u.from("lessons").select("id, module_id, title, description, video_provider, video_id, video_duration_sec, est_minutes, lesson_xp, node_kind, sort_order, retired, has_quiz, is_free, steps").not("steps", "is", null).limit(5), "stepped lessons");
  ensure(rows.length, "no lessons with steps");
  const row = rows.find((r) => !r.retired) ?? rows[0];
  const parsed = parseLessonSteps(row.steps, { title: row.title, xp: row.lesson_xp ?? LEARN_XP.LESSON });
  ensure(parsed, "parseLessonSteps returned null for a lessons.steps row");
  ensure(Array.isArray(parsed.steps) && parsed.steps.length > 0, "parsed lesson has no steps");
  ensure(parsed.steps.every((s) => s && typeof s.type === "string"), "a step has no type");
  const kinds = [...new Set(parsed.steps.map((s) => s.type))];
  // the reader's surrounding joins must resolve too (module → course → siblings)
  const mod = err(await u.from("modules").select("id, course_id, title, description, sort_order").eq("id", row.module_id).maybeSingle(), "module");
  ensure(mod, "stepped lesson has no module");
  const course = err(await u.from("courses").select("id, slug, title, min_tier, program").eq("id", mod.course_id).maybeSingle(), "course");
  ensure(course, "stepped lesson has no course");
  const register = deriveRegister(me);
  return `"${row.title}" · ${parsed.steps.length} steps [${kinds.join(", ")}] · xp ${parsed.xp} · course ${course.slug} · register ${register}`;
});

/* ── 3. one legacy lesson resolves ─────────────────────────────────── */
await check("legacy lesson (video_provider) resolves", async () => {
  const rows = err(await u.from("lessons").select("id, module_id, title, video_provider, video_id, video_duration_sec, retired").not("video_provider", "is", null).limit(50), "legacy lessons");
  const live = rows.filter((r) => !r.retired);
  ensure(live.length, "no lessons with a video_provider");
  const providers = [...new Set(live.map((r) => r.video_provider))];
  const known = providers.filter((p) => ["youtube", "html", "bunny", "mux"].includes(p));
  ensure(known.length === providers.length, `unknown video_provider(s): ${providers.filter((p) => !known.includes(p)).join(", ")}`);
  const row = live[0];
  ensure(parseLessonSteps(null, { title: row.title, xp: 50 }) === null, "parseLessonSteps should return null for a legacy lesson");
  const resolved = resolveLegacyVideoId(row.video_provider, row.video_id);
  ensure(resolved, "resolveLegacyVideoId returned null for a legacy lesson");
  if (row.video_provider === "html" && String(row.video_id).startsWith("/")) ensure(/^https?:\/\//.test(resolved), "html lesson id was not resolved to an absolute origin");
  return `${live.length} live legacy lessons · providers [${providers.join(", ")}] · "${row.title}" → ${String(resolved).slice(0, 60)}`;
});

/* ── 4. lesson player extras: quiz + resources + step resume ───────── */
let quizRow = null;
await check("quizzes + lesson_resources + lesson_step_progress read", async () => {
  const quizzes = err(await u.from("quizzes").select("id, lesson_id, questions, passing_score").limit(5), "quizzes");
  ensure(quizzes.length, "no quizzes visible");
  quizRow = quizzes.find((q) => Array.isArray(q.questions) && q.questions.some((x) => x && Array.isArray(x.options) && typeof x.correctIndex === "number")) ?? quizzes[0];
  const shaped = Array.isArray(quizRow.questions) ? quizRow.questions.filter((x) => x && Array.isArray(x.options) && typeof x.correctIndex === "number") : [];
  ensure(shaped.length, `quiz ${quizRow.id} has no {options, correctIndex} questions — the reader would render an empty quiz`);
  err(await u.from("lesson_resources").select("id, type, title, description, video_provider, video_id, file_url, file_name, external_url, sort_order").limit(5), "lesson_resources");
  err(await u.from("lesson_step_progress").select("step_index").eq("user_id", uid).limit(5), "lesson_step_progress");
  return `${quizzes.length} quizzes sampled · pass mark ${quizRow.passing_score ?? QUIZ_PASS_PCT} · ${shaped.length} shaped questions`;
});

/* ── 5. flashcards + review deck ───────────────────────────────────── */
let card = null;
await check("flashcards + flashcard_reviews load (review deck)", async () => {
  const all = err(await u.from("flashcards").select("id, front, back, set_slug, track").limit(40), "flashcards");
  ensure(all.length, "no flashcards visible");
  const track = deriveRegister(me) === "kid" ? "kids" : deriveRegister(me) === "teen" ? "teens" : "adults";
  const deck = err(await u.from("flashcards").select("id, front, back, set_slug, track, week, visual").eq("track", track).order("week", { ascending: true, nullsFirst: false }), "deck");
  ensure(deck.length, `no flashcards for track ${track} — /learn/review would be empty`);
  const reviews = err(await u.from("flashcard_reviews").select("card_id, due_at, streak, updated_at").eq("user_id", uid), "flashcard_reviews");
  const reviewed = new Set(reviews.map((r) => r.card_id));
  card = deck.find((c) => !reviewed.has(c.id)) ?? deck[0];
  return `${all.length} sampled · ${deck.length} on track ${track} · ${reviews.length} of mine reviewed`;
});

/* ── 6. skills + live sessions ─────────────────────────────────────── */
let skill = null;
await check("skills + skill_mastery load", async () => {
  const skills = err(await u.from("skills").select("id, name, domain, sort").order("sort"), "skills");
  ensure(skills.length, "no skills visible");
  const mastery = err(await u.from("skill_mastery").select("skill_id, mastery_score, attempts, next_review_at").eq("user_id", uid), "skill_mastery");
  const mine = new Set(mastery.map((m) => m.skill_id));
  skill = skills.find((s) => !mine.has(s.id)) ?? skills[0];
  return `${skills.length} skills · ${mastery.length} mastered rows`;
});

await check("live sessions + live events + rsvps load", async () => {
  const SESSION_COLS = "id, title, description, scheduled_at, duration_min, status, host_name, host_title, recording_url, recording_path, recording_kind, class_type, track, zoom_join_url, worksheet_url, assignment, min_tier";
  const EVENT_COLS = "id, status, room_type, title, description, tickers, host_name, starts_at, duration_min, join_url, replay_url, viewer_count, interested_count";
  const sessions = err(await u.from("live_sessions").select(SESSION_COLS).order("scheduled_at", { ascending: false }).limit(60), "live_sessions");
  ensure(sessions.length, "no live_sessions visible");
  const events = err(await u.from("live_events").select(EVENT_COLS).order("starts_at", { ascending: false }).limit(30), "live_events");
  const rsvps = err(await u.from("session_rsvps").select("session_id, user_id"), "session_rsvps");
  const uploads = sessions.filter((s) => s.recording_path);
  let signed = "no upload recordings to sign";
  if (uploads.length) {
    const r = await u.storage.from("class-recordings").createSignedUrl(uploads[0].recording_path, 3600);
    signed = r.error ? `signed URL FAILED: ${r.error.message}` : "signed URL ok";
    if (r.error) throw new Error(`class-recordings signed URL: ${r.error.message}`);
  }
  return `${sessions.length} sessions · ${events.length} events · ${rsvps.length} rsvps · ${signed}`;
});

/* ── writes ────────────────────────────────────────────────────────── */
// A lesson this member has never touched, so every row below is one we created.
let testLesson = null;
await check("picked an untouched test lesson for the write phase", async () => {
  ensure(curriculum, "curriculum did not load");
  const touched = new Set(curriculum.progress.map((p) => p.lesson_id));
  const steps = await u.from("lesson_step_progress").select("lesson_id").eq("user_id", uid);
  for (const r of steps.data ?? []) touched.add(r.lesson_id);
  testLesson = curriculum.lessons.find((l) => !touched.has(l.id) && curriculum.stepped.has(l.id)) ?? curriculum.lessons.find((l) => !touched.has(l.id));
  ensure(testLesson, "every lesson already has progress for this member — refusing to touch pre-existing rows");
  return `${testLesson.title} (${testLesson.id.slice(0, 8)}, ${curriculum.stepped.has(testLesson.id) ? "stepped" : "legacy"})`;
});

await check("WRITE lesson_progress (POST /api/learn/progress + /complete shape) → read back", async () => {
  ensure(testLesson, "no test lesson");
  const row = { user_id: uid, lesson_id: testLesson.id, status: "in_progress", progress_pct: 42 };
  err(await u.from("lesson_progress").upsert(row, { onConflict: "user_id,lesson_id" }), "upsert lesson_progress");
  cleanups.push(["lesson_progress", async () => u.from("lesson_progress").delete().eq("user_id", uid).eq("lesson_id", testLesson.id)]);
  let back = err(await u.from("lesson_progress").select("status, progress_pct, time_spent_sec").eq("user_id", uid).eq("lesson_id", testLesson.id).maybeSingle(), "read lesson_progress");
  ensure(back && back.progress_pct === 42 && back.status === "in_progress", `read back ${JSON.stringify(back)}`);
  // the /complete shape (status + completed_at + time_spent_sec) must satisfy the same unique key
  err(await u.from("lesson_progress").upsert({ user_id: uid, lesson_id: testLesson.id, status: "completed", progress_pct: 100, completed_at: new Date().toISOString(), time_spent_sec: 61 }, { onConflict: "user_id,lesson_id" }), "upsert complete");
  back = err(await u.from("lesson_progress").select("status, progress_pct, completed_at, time_spent_sec").eq("user_id", uid).eq("lesson_id", testLesson.id).maybeSingle(), "read complete");
  ensure(back.status === "completed" && back.progress_pct === 100 && back.time_spent_sec === 61 && back.completed_at, `complete read back ${JSON.stringify(back)}`);
  return "in_progress 42% → completed 100% (one row, upsert on user_id,lesson_id)";
});

await check("WRITE lesson_step_progress (POST /api/learn/step) → read back", async () => {
  ensure(testLesson, "no test lesson");
  err(await u.from("lesson_step_progress").upsert({ user_id: uid, lesson_id: testLesson.id, step_index: 3, step_state: { seen: [0, 1, 2] } }, { onConflict: "user_id,lesson_id" }), "upsert step");
  cleanups.push(["lesson_step_progress", async () => u.from("lesson_step_progress").delete().eq("user_id", uid).eq("lesson_id", testLesson.id)]);
  const first = err(await u.from("lesson_step_progress").select("step_index, step_state, updated_at").eq("user_id", uid).eq("lesson_id", testLesson.id).maybeSingle(), "read step");
  ensure(first && first.step_index === 3, `read back ${JSON.stringify(first)}`);
  ensure(first.step_state && Array.isArray(first.step_state.seen), "step_state jsonb did not round-trip");
  // the touch_lesson_step_progress trigger must stamp updated_at on the next write
  await new Promise((r) => setTimeout(r, 1100));
  err(await u.from("lesson_step_progress").upsert({ user_id: uid, lesson_id: testLesson.id, step_index: 4, step_state: { done: true } }, { onConflict: "user_id,lesson_id" }), "upsert step 2");
  const second = err(await u.from("lesson_step_progress").select("step_index, updated_at").eq("user_id", uid).eq("lesson_id", testLesson.id).maybeSingle(), "read step 2");
  ensure(second.step_index === 4, "step_index did not advance");
  ensure(new Date(second.updated_at) > new Date(first.updated_at), "trigger touch_lesson_step_progress did not move updated_at");
  return `resume step 3 → 4 · touch_lesson_step_progress stamped updated_at`;
});

await check("WRITE quiz_attempts (POST /api/learn/quiz) → read back", async () => {
  ensure(quizRow, "no quiz");
  const qs = Array.isArray(quizRow.questions) ? quizRow.questions.filter((x) => x && Array.isArray(x.options) && typeof x.correctIndex === "number") : [];
  ensure(qs.length, "quiz has no gradeable questions");
  const answers = qs.map((q) => ({ question: q.question, selected: q.correctIndex, correct_index: q.correctIndex, is_correct: true }));
  const score = 100, passed = score >= (quizRow.passing_score ?? QUIZ_PASS_PCT);
  const row = err(await u.from("quiz_attempts").insert({ user_id: uid, quiz_id: quizRow.id, score, passed, answers }).select("id, score, passed").single(), "insert quiz_attempt");
  cleanups.push(["quiz_attempts", async () => u.from("quiz_attempts").delete().eq("id", row.id)]);
  const back = err(await u.from("quiz_attempts").select("id, quiz_id, score, passed, answers").eq("id", row.id).maybeSingle(), "read quiz_attempt");
  ensure(back && back.score === 100 && back.passed === true, `read back ${JSON.stringify({ ...back, answers: undefined })}`);
  ensure(Array.isArray(back.answers) && back.answers.length === qs.length, "answers jsonb did not round-trip");
  return `attempt ${row.id.slice(0, 8)} · ${qs.length} questions · score 100 · passed`;
});

await check("WRITE flashcard_reviews (POST /api/learn/flashcard) → read back", async () => {
  ensure(card, "no flashcard");
  const prev = err(await u.from("flashcard_reviews").select("card_id, due_at, interval_days, streak, last_result").eq("user_id", uid).eq("card_id", card.id).maybeSingle(), "read prior review");
  const due = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  err(await u.from("flashcard_reviews").upsert({ user_id: uid, card_id: card.id, due_at: due, interval_days: 2, streak: 1, last_result: "got_it", updated_at: new Date().toISOString() }, { onConflict: "user_id,card_id" }), "upsert review");
  cleanups.push(["flashcard_reviews", async () => (prev
    ? u.from("flashcard_reviews").update(prev).eq("user_id", uid).eq("card_id", card.id)
    : u.from("flashcard_reviews").delete().eq("user_id", uid).eq("card_id", card.id))]);
  const back = err(await u.from("flashcard_reviews").select("card_id, due_at, interval_days, streak, last_result").eq("user_id", uid).eq("card_id", card.id).maybeSingle(), "read review");
  ensure(back && back.interval_days === 2 && back.streak === 1 && back.due_at === due, `read back ${JSON.stringify(back)}`);
  return `card ${card.id} · due ${due} · streak 1${prev ? " (prior row will be restored)" : " (new row, will be removed)"}`;
});

await check("WRITE skill_mastery via RPC bump_skill_mastery (POST /api/learn/mastery) → read back", async () => {
  ensure(skill, "no skill");
  const prev = err(await u.from("skill_mastery").select("skill_id, mastery_score, attempts, correct, streak, interval_days, last_seen, next_review_at").eq("user_id", uid).eq("skill_id", skill.id).maybeSingle(), "read prior mastery");
  const r = await u.rpc("bump_skill_mastery", { p_skill_id: skill.id, p_correct: true });
  if (r.error) throw new Error(`rpc bump_skill_mastery: ${r.error.code ?? ""} ${r.error.message}`);
  cleanups.push(["skill_mastery", async () => (prev
    ? u.from("skill_mastery").update(prev).eq("user_id", uid).eq("skill_id", skill.id)
    : u.from("skill_mastery").delete().eq("user_id", uid).eq("skill_id", skill.id))]);
  const back = err(await u.from("skill_mastery").select("skill_id, mastery_score, attempts, correct").eq("user_id", uid).eq("skill_id", skill.id).maybeSingle(), "read mastery");
  ensure(back, "bump_skill_mastery wrote no row");
  ensure(back.attempts > (prev?.attempts ?? 0), `attempts did not increase (${prev?.attempts ?? 0} → ${back.attempts})`);
  // unknown skills must be ignored, not error
  const bogus = await u.rpc("bump_skill_mastery", { p_skill_id: "smoke_not_a_skill", p_correct: true });
  if (bogus.error) throw new Error(`bump_skill_mastery should ignore unknown skills, got ${bogus.error.message}`);
  const ghost = await u.from("skill_mastery").select("skill_id").eq("user_id", uid).eq("skill_id", "smoke_not_a_skill").maybeSingle();
  ensure(!ghost.data, "bump_skill_mastery created a row for an unknown skill");
  return `${skill.id} · attempts ${prev?.attempts ?? 0} → ${back.attempts} · score ${back.mastery_score}${prev ? " (prior row will be restored)" : " (new row, will be removed)"}`;
});

const XP_REF = `smoke:learn:${Date.now()}`;
await check("WRITE xp_events (awardXp) → read back", async () => {
  const before = err(await u.from("xp_events").select("amount").eq("user_id", uid), "read xp");
  const lifetimeBefore = before.reduce((a, r) => a + (r.amount ?? 0), 0);
  err(await u.from("xp_events").insert({ user_id: uid, amount: 1, kind: "bonus", ref_id: XP_REF }), "insert xp_event");
  cleanups.push(["xp_events (service role — no member DELETE policy)", async () => admin.from("xp_events").delete().eq("user_id", uid).eq("ref_id", XP_REF)]);
  const back = err(await u.from("xp_events").select("id, amount, kind, ref_id").eq("user_id", uid).eq("ref_id", XP_REF), "read xp_event");
  ensure(back.length === 1 && back[0].amount === 1, `read back ${JSON.stringify(back)}`);
  // awardOnce / hasXpForRef: the same (kind, ref) must be seen as already banked
  const { count } = await u.from("xp_events").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("kind", "bonus").eq("ref_id", XP_REF);
  ensure(count === 1, `hasXpForRef would not dedupe (count ${count})`);
  const after = err(await u.from("xp_events").select("amount").eq("user_id", uid), "read xp after");
  ensure(after.reduce((a, r) => a + (r.amount ?? 0), 0) === lifetimeBefore + 1, "lifetimeXp did not move by 1");
  return `lifetime ${lifetimeBefore} → ${lifetimeBefore + 1} · once-per-ref dedupe holds`;
});

/* ── practice / simulator (POST /api/practice/order) ───────────────── */
await check("practice simulator tables + family_writes_allowed() readable", async () => {
  const port = err(await u.from("sim_portfolios").select("id, balance, starting_balance, total_pnl, total_trades, winning_trades").eq("user_id", uid).maybeSingle(), "sim_portfolios");
  if (port) {
    err(await u.from("sim_positions").select("id, symbol, side, quantity, entry_price, opened_at").eq("portfolio_id", port.id), "sim_positions");
    err(await u.from("sim_trades").select("id, symbol, side, quantity, entry_price, exit_price, pnl, opened_at, closed_at").eq("portfolio_id", port.id).limit(5), "sim_trades");
  }
  const g = await u.rpc("family_writes_allowed");
  if (g.error) throw new Error(`rpc family_writes_allowed: ${g.error.code ?? ""} ${g.error.message}`);
  return `${port ? `portfolio ${port.id.slice(0, 8)} balance ${port.balance}` : "no portfolio yet (the route creates one on first order)"} · family_writes_allowed() = ${g.data}`;
});

let price = null;
await check("Polygon price resolves (priceOf → market-bridge → getQuote)", async () => {
  ensure(env.POLYGON_API_KEY, "POLYGON_API_KEY missing from .env.local — /api/practice/order would answer 503 for every order");
  const res = await fetch(`https://api.polygon.io/v2/aggs/ticker/AAPL/prev?adjusted=true&apiKey=${env.POLYGON_API_KEY}`);
  const body = await res.json();
  ensure(res.ok, `polygon ${res.status} ${body?.error ?? ""}`);
  const c = body?.results?.[0]?.c;
  ensure(typeof c === "number" && c > 0, `no close in polygon response (${body?.status})`);
  price = +c.toFixed(2);
  return `AAPL last close $${price} (same source as src/lib/market/quote.ts)`;
});

await check("WRITE /api/practice/order round trip: buy 1 AAPL → sell 1 → portfolio restored", async () => {
  const p = price ?? 100;
  const round2 = (n) => Math.round(n * 100) / 100;
  const before = err(await u.from("sim_portfolios").select("id, balance, starting_balance, total_pnl, total_trades, winning_trades").eq("user_id", uid).maybeSingle(), "portfolio");
  ensure(before, "no sim_portfolio for this member — create one by placing a real order first");
  const snapshot = { balance: before.balance, total_pnl: before.total_pnl, total_trades: before.total_trades, winning_trades: before.winning_trades };
  const refs = [];
  // hard restore even if a later step throws
  cleanups.push(["sim_portfolios (balance + counters)", async () => u.from("sim_portfolios").update(snapshot).eq("id", before.id)]);

  // BUY
  const pos = err(await u.from("sim_positions").insert({ portfolio_id: before.id, symbol: "AAPL", side: "long", quantity: 1, entry_price: p, opened_at: new Date().toISOString() }).select("id, opened_at").single(), "insert sim_position");
  cleanups.push(["sim_positions (test lot)", async () => u.from("sim_positions").delete().eq("id", pos.id)]);
  err(await u.from("sim_portfolios").update({ balance: round2(Number(before.balance) - p), updated_at: new Date().toISOString() }).eq("id", before.id), "debit balance");
  refs.push(`sim:${pos.id}`);
  const afterBuy = err(await u.from("sim_portfolios").select("balance").eq("id", before.id).maybeSingle(), "read balance");
  ensure(round2(Number(afterBuy.balance)) === round2(Number(before.balance) - p), `balance after buy ${afterBuy.balance}, expected ${round2(Number(before.balance) - p)}`);

  // SELL the same lot (FIFO) at the same price → pnl 0
  const now = new Date().toISOString();
  const trade = err(await u.from("sim_trades").insert({ portfolio_id: before.id, symbol: "AAPL", side: "long", quantity: 1, entry_price: p, exit_price: p, pnl: 0, opened_at: pos.opened_at, closed_at: now }).select("id, pnl").single(), "insert sim_trade");
  cleanups.push(["sim_trades (test trade)", async () => u.from("sim_trades").delete().eq("id", trade.id)]);
  err(await u.from("sim_positions").delete().eq("id", pos.id), "close lot");
  err(await u.from("sim_portfolios").update({ balance: round2(Number(before.balance)), total_pnl: round2(Number(before.total_pnl ?? 0)), total_trades: (before.total_trades ?? 0) + 1, winning_trades: before.winning_trades ?? 0, updated_at: now }).eq("id", before.id), "credit balance");
  refs.push(`sim:sell:AAPL:${now}`);
  for (const ref of refs) {
    err(await u.from("xp_events").insert({ user_id: uid, amount: LEARN_XP.PRACTICE_ORDER, kind: "game", ref_id: ref }), `xp ${ref}`);
    cleanups.push([`xp_events ${ref.slice(0, 20)}… (service role)`, async () => admin.from("xp_events").delete().eq("user_id", uid).eq("ref_id", ref)]);
  }
  const afterSell = err(await u.from("sim_portfolios").select("balance, total_trades").eq("id", before.id).maybeSingle(), "read after sell");
  ensure(round2(Number(afterSell.balance)) === round2(Number(before.balance)), `balance did not return to ${before.balance} (got ${afterSell.balance})`);
  const back = err(await u.from("sim_trades").select("id, symbol, quantity, entry_price, exit_price, pnl").eq("id", trade.id).maybeSingle(), "read trade");
  ensure(back && Number(back.pnl) === 0 && back.symbol === "AAPL", `trade read back ${JSON.stringify(back)}`);
  return `1 lot @ $${p} in and out · pnl $0 · trade ${trade.id.slice(0, 8)} · balance ${before.balance} → ${afterSell.balance} · every row is removed below`;
});

/* ── cleanup ───────────────────────────────────────────────────────── */
console.log("\ncleanup");
for (const [label, fn] of cleanups.reverse()) {
  const res = await fn();
  if (res?.error) { leftBehind.push(`${label}: ${res.error.message}`); console.log(`  LEFT  ${label} — ${res.error.message}`); }
  else console.log(`  ok    ${label} restored`);
}

console.log(`\n${pass} passed · ${fail} failed`);
if (leftBehind.length) console.log(`left behind: ${leftBehind.join(" | ")}`);
await u.auth.signOut();
process.exit(fail || leftBehind.length ? 1 : 0);
