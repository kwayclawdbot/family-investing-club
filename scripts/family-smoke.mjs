/**
 * Lane FAMILY smoke — exercises `src/lib/live/family.ts` and `src/app/api/family/**` against the live
 * FTA project AS the seeded member (magic-link session, same pattern as scripts/identity-smoke.mjs),
 * so RLS is really tested.
 *
 * Reads replicate each reader's exact column list and join shape. Writes touch only rows this script
 * creates, or are set back to the value captured before the run; nothing pre-existing is left changed.
 *
 *   node scripts/family-smoke.mjs
 *   SMOKE_EMAIL=someone@example.com node scripts/family-smoke.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

/* ── session ───────────────────────────────────────────────────────── */
const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SMOKE_EMAIL ?? "kcoffie90@gmail.com";
const startedAt = new Date().toISOString();

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const { data: link, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
if (le) { console.error("generateLink failed:", le.message); process.exit(1); }
const u = createClient(URL_, ANON, { auth: { persistSession: false } });
const { data: sess, error: ve } = await u.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
if (ve || !sess?.session) { console.error("verifyOtp failed:", ve?.message); process.exit(1); }
const uid = sess.user.id;
const { data: me } = await u.from("profiles").select("id, role, age_group, display_name, family_id").eq("id", uid).maybeSingle();
if (!me?.family_id) { console.error("this member has no family_id — nothing for the FAMILY lane to smoke"); process.exit(1); }
const FAM = me.family_id;
console.log(`FAMILY smoke — ${EMAIL} (${uid.slice(0, 8)}) role=${me.role} family=${FAM.slice(0, 8)}\n`);

/* ── harness ───────────────────────────────────────────────────────── */
let pass = 0, fail = 0;
const cleanups = [], leftBehind = [];
async function check(name, fn) {
  try { const note = await fn(); pass++; console.log(`PASS  ${name}${note ? ` — ${note}` : ""}`); }
  catch (e) { fail++; console.log(`FAIL  ${name} — ${e?.message ?? e}`); }
}
const ensure = (c, m) => { if (!c) throw new Error(m); };
const err = (res, what) => { if (res.error) throw new Error(`${what}: ${res.error.code ?? ""} ${res.error.message}`); return res.data; };

/* ── 1. household + members (family.householdContext) ──────────────── */
let kid = null, rpcVerdict = "";
await check("household + members load (profiles · xp_for_users · xp_events)", async () => {
  const fam = err(await u.from("families").select("id, name, plan_tier, door, stripe_customer_id, expires_at").eq("id", FAM).maybeSingle(), "families");
  ensure(fam, "the member's own family row is not visible under RLS");
  const tier = err(await u.from("family_tiers").select("tier, club_lapsed").eq("family_id", FAM).maybeSingle(), "family_tiers");
  const rows = err(await u.from("profiles").select("id, display_name, email, role, age_group, comprehension_level, username, avatar_url, created_at").eq("family_id", FAM).order("created_at"), "profiles");
  ensure(rows.length, "no household members visible");
  const ids = rows.map((r) => r.id);
  const totals = await u.rpc("xp_for_users", { p_user_ids: ids });
  if (totals.error) throw new Error(`rpc xp_for_users: ${totals.error.code ?? ""} ${totals.error.message}`);
  ensure(Array.isArray(totals.data), "xp_for_users returned no rows shape");
  err(await u.from("xp_events").select("user_id, amount, created_at").in("user_id", ids).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()), "xp_events week");
  err(await u.from("xp_events").select("user_id, created_at").in("user_id", ids).order("created_at", { ascending: false }).limit(200), "xp_events last");
  kid = rows.find((r) => r.role === "child" || r.age_group === "kids" || r.age_group === "teens") ?? null;
  return `"${fam.name}" door=${fam.door} tier=${tier?.tier ?? "none"} · ${rows.length} members (${rows.filter((r) => r.role === "child").length} kids) · xp_for_users ${totals.data.length} rows`;
});

/* ── 2. per-learner report (child_report_stats + the whole reader) ── */
await check("learner report loads (child_report_stats + lesson_progress/badges/activity/paper/notes)", async () => {
  ensure(kid, "this household has no child profile to report on");
  const rpc = await u.rpc("child_report_stats", { p_child: kid.id });
  if (rpc.error) throw new Error(`rpc child_report_stats: ${rpc.error.code ?? ""} ${rpc.error.message}`);
  ensure(rpc.data && typeof rpc.data === "object", "child_report_stats returned no jsonb");
  // FTA's function demands profiles.role = 'parent' exactly; a household admin gets 'forbidden' and the
  // reader falls through to computeReport() — so the page still renders. Recorded, not failed.
  rpcVerdict = rpc.data.error ? `child_report_stats → ${rpc.data.error} for role='${me.role}' (reader falls back to computeReport)` : "rpc";
  const prog = err(await u.from("lesson_progress").select("lesson_id, status, progress_pct, time_spent_sec, updated_at, lessons(title)").eq("user_id", kid.id).order("updated_at", { ascending: false }).limit(300), "lesson_progress + lessons join");
  const totals = err(await u.from("lessons").select("id, retired, modules!inner(courses!inner(published))").eq("modules.courses.published", true).limit(500), "lessons ← modules ← courses inner join");
  ensure(totals.length, "the published-lessons denominator came back empty");
  err(await u.from("xp_events").select("id, user_id, amount, kind, ref_id, created_at").eq("user_id", kid.id).order("created_at", { ascending: false }).limit(10), "xp_events");
  err(await u.from("badge_awards").select("id, awarded_at, badges(slug, title)").eq("user_id", kid.id).order("awarded_at", { ascending: false }).limit(12), "badge_awards + badges join");
  err(await u.from("family_guardrail_events").select("id, setting, old_value, new_value, created_at, actor_id").eq("child_id", kid.id).order("created_at", { ascending: false }).limit(6), "family_guardrail_events");
  err(await u.from("family_activity_days").select("day, minutes").eq("child_id", kid.id).gte("day", new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)).order("day"), "family_activity_days");
  const paper = await u.rpc("family_paper_account", { p_child: kid.id });
  if (paper.error) throw new Error(`rpc family_paper_account: ${paper.error.code ?? ""} ${paper.error.message}`);
  err(await u.from("report_notes").select("week, note, created_at").eq("child_id", kid.id).order("week", { ascending: false }).limit(1).maybeSingle(), "report_notes");
  // computeReport()'s own queries — the branch this member actually takes
  err(await u.from("quiz_attempts").select("quiz_id, score, created_at").eq("user_id", kid.id).order("created_at", { ascending: false }).limit(200), "quiz_attempts (computeReport)");
  err(await u.from("game_scores").select("score, created_at").eq("user_id", kid.id).order("created_at", { ascending: false }).limit(100), "game_scores (computeReport)");
  err(await u.from("sim_scenario_scores").select("total_score, created_at").eq("user_id", kid.id).order("created_at", { ascending: false }).limit(100), "sim_scenario_scores (computeReport)");
  const ficTotal = err(await u.from("lessons").select("id, retired, modules!inner(track, courses!inner(program, published))").eq("modules.courses.published", true).eq("modules.courses.program", "fic").limit(500), "ficLessonTotal query");
  const band = kid.age_group ?? "adults";
  const tracked = ficTotal.filter((l) => !l.retired && (l.modules?.track == null || l.modules.track === band));
  ensure(tracked.length, `ficLessonTotal found no ${band} FIC lessons — computeReport would fall back to the whole library`);
  const r = rpc.data;
  const src = r.error ? `computed fallback (${tracked.length} ${band} FIC lessons)` : `rpc ${r.foundations_done ?? 0}/${r.foundations_total ?? 0} lessons · quizzes ${r.quiz_count ?? 0} · xp ${r.xp ?? 0}`;
  return `${kid.display_name}: ${src} · ${prog.length} progress rows · denominator ${totals.filter((l) => !l.retired).length} live lessons · paper ${paper.data?.portfolio ? "portfolio present" : "no portfolio"}\n      note: ${rpcVerdict}`;
});

/* The FTA RPC itself: proven by momentarily presenting this member as role='parent' (the only role the
 * function accepts), then putting the role back with the service key. Nothing else about the row moves. */
await check("child_report_stats returns a real report for a role='parent' caller", async () => {
  ensure(kid, "no child");
  if (me.role === "parent") { const r = await u.rpc("child_report_stats", { p_child: kid.id }); ensure(!r.data?.error, `refused: ${r.data?.error}`); return "caller is already a parent"; }
  const restore = async () => admin.from("profiles").update({ role: me.role }).eq("id", uid);
  cleanups.push([`profiles.role → ${me.role}`, restore]);
  const flip = await admin.from("profiles").update({ role: "parent" }).eq("id", uid).select("role").single();
  if (flip.error) throw new Error(`could not present as parent: ${flip.error.message}`);
  const r = await u.rpc("child_report_stats", { p_child: kid.id });
  await restore();
  if (r.error) throw new Error(`rpc child_report_stats: ${r.error.code ?? ""} ${r.error.message}`);
  ensure(r.data && !r.data.error, `still refused as a parent: ${r.data?.error}`);
  const d = r.data;
  for (const k of ["foundations_total", "foundations_done", "quiz_count", "xp", "badges_count"]) ensure(k in d, `RpcReport field ${k} missing from the payload`);
  return `track ${d.track} · ${d.foundations_done}/${d.foundations_total} FIC lessons · quizzes ${d.quiz_count} (avg ${d.quiz_avg ?? "—"}) · behind ${d.behind_count} · xp ${d.xp} · badges ${d.badges_count}`;
});

/* ── 3. guardrails: read + write + restore (RPC set_family_guardrail) ─ */
await check("guardrails read + WRITE via set_family_guardrail + restore", async () => {
  ensure(kid, "no child to set a guardrail on");
  const prior = err(await u.from("family_guardrails").select("*").eq("child_id", kid.id).maybeSingle(), "read guardrails");
  const before = prior?.downtime_start_hour ?? 21;
  const target = before === 22 ? 20 : 22;

  const set = await u.rpc("set_family_guardrail", { p_child: kid.id, p_setting: "downtime_start_hour", p_value: target });
  if (set.error) throw new Error(`rpc set_family_guardrail: ${set.error.code ?? ""} ${set.error.message}`);
  // restore first (runs last, after the assertions below have already read the new value)
  cleanups.push(["family_guardrails downtime_start_hour", async () => {
    const back = await u.rpc("set_family_guardrail", { p_child: kid.id, p_setting: "downtime_start_hour", p_value: before });
    if (back.error) return { error: back.error };
    // audit rows + (if we created it) the guardrails row itself are ours — remove them
    const ev = await admin.from("family_guardrail_events").delete().eq("child_id", kid.id).eq("actor_id", uid).gte("created_at", startedAt);
    if (ev.error) return { error: ev.error };
    if (!prior) return admin.from("family_guardrails").delete().eq("child_id", kid.id);
    return { error: null };
  }]);
  cleanups.push(["notifications raised by the guardrail change", async () => admin.from("notifications").delete().eq("actor_id", uid).eq("type", "guardrail").gte("created_at", startedAt)]);

  ensure(set.data?.downtime_start_hour === target, `RPC returned downtime_start_hour ${set.data?.downtime_start_hour}, expected ${target}`);
  const back = err(await u.from("family_guardrails").select("child_id, family_id, chat_family_only, downtime_enabled, downtime_start_hour, downtime_end_hour, daily_limit_min, live_listen_only, tz, updated_at, updated_by").eq("child_id", kid.id).maybeSingle(), "read back guardrails");
  ensure(back && back.downtime_start_hour === target, `read back ${JSON.stringify(back)}`);
  ensure(back.family_id === FAM && back.updated_by === uid, "guardrail row was not stamped with this household / actor");
  const events = err(await u.from("family_guardrail_events").select("id, setting, old_value, new_value").eq("child_id", kid.id).gte("created_at", startedAt), "guardrail events");
  ensure(events.some((e) => e.setting === "downtime_start_hour"), "set_family_guardrail did not log a family_guardrail_events row");
  // the route's own validation must be the same shape the DB enforces
  const bogus = await u.rpc("set_family_guardrail", { p_child: kid.id, p_setting: "not_a_setting", p_value: 1 });
  ensure(bogus.error, "set_family_guardrail accepted an unknown setting");
  return `downtime_start_hour ${before} → ${target} (restored) · ${events.length} audit row(s) written and removed${prior ? "" : " · guardrail row created by this run and removed"}`;
});

/* ── 4. invites: create then delete ────────────────────────────────── */
await check("family invite created then deleted (POST + DELETE /api/family/invite)", async () => {
  const existing = err(await u.from("family_invites").select("id, code, role, age_group, email, used_by, expires_at, created_at").eq("family_id", FAM).order("created_at", { ascending: false }), "read invites");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const expires = new Date(Date.now() + 7 * 86400000).toISOString();
  const row = err(await u.from("family_invites").insert({ family_id: FAM, code, role: "child", age_group: "kids", email: null, expires_at: expires }).select("id, code, expires_at").single(), "insert invite");
  cleanups.push(["family_invites (test invite)", async () => u.from("family_invites").delete().eq("id", row.id)]);
  const back = err(await u.from("family_invites").select("id, code, role, age_group, used_by, expires_at").eq("id", row.id).maybeSingle(), "read invite");
  ensure(back && back.code === code && back.role === "child" && back.age_group === "kids" && !back.used_by, `read back ${JSON.stringify(back)}`);
  // DELETE path: unused invite, own household
  const del = err(await u.from("family_invites").delete({ count: "exact" }).eq("id", row.id).eq("family_id", FAM).is("used_by", null).select("id"), "delete invite");
  ensure(del.length === 1, `DELETE matched ${del.length} rows — RLS "Parents manage family invites" refuses the route's delete`);
  const gone = err(await u.from("family_invites").select("id").eq("id", row.id).maybeSingle(), "confirm gone");
  ensure(!gone, "invite still present after delete");
  return `${existing.length} pre-existing invites left untouched · created ${code} → deleted`;
});

/* ── 5. family watchlist (+ votes) read ────────────────────────────── */
await check("family watchlist + votes read (family.loadWatchlist)", async () => {
  const night = new Date().toISOString().slice(0, 10);
  const wl = err(await u.from("family_watchlist").select("id, ticker, company_name, status, champion_id, why_we_picked, how_they_make_money, what_they_sell, strength, risk, updated_at, wl_active").eq("family_id", FAM).order("updated_at", { ascending: false }).limit(24), "family_watchlist");
  const votes = err(await u.from("family_watchlist_votes").select("id, user_id, ticker, company_name, vote_night").eq("family_id", FAM).eq("vote_night", night), "family_watchlist_votes");
  const active = wl.filter((r) => r.wl_active !== false);
  err(await u.from("family_night_sessions").select("id, night, ticker, company_name, host_id, attendee_ids").eq("family_id", FAM).order("night", { ascending: false }).limit(6), "family_night_sessions");
  err(await u.from("fic_missions").select("id, slug, title, description, kid_prompt, xp_reward, sort").order("sort"), "fic_missions");
  err(await u.from("mission_completions").select("mission_id, user_id, completed_at").eq("family_id", FAM), "mission_completions");
  return `${active.length} active companies (${wl.length} rows) · ${votes.length} votes for ${night}${active[0] ? ` · e.g. ${active[0].ticker}` : ""}`;
});

/* ── 6. own profile: settings read + display_name write + restore ──── */
await check("profile settings read (family.getProfileSettings) + badges + progress", async () => {
  const row = err(await u.from("profiles").select("id, display_name, username, avatar_url, role, age_group, comprehension_level, notification_prefs, email").eq("id", uid).maybeSingle(), "profiles");
  ensure(row, "own profile not visible");
  const badges = err(await u.from("badges").select("id, slug, title, description, subtitle, sort").order("sort"), "badges");
  ensure(badges.length, "no badges catalogue");
  err(await u.from("badge_awards").select("badge_id, awarded_at").eq("user_id", uid), "badge_awards");
  err(await u.from("skill_mastery").select("skill_id, mastery_score, skills(name, domain)").eq("user_id", uid), "skill_mastery + skills join");
  err(await u.from("lesson_progress").select("status, updated_at, lessons(title)").eq("user_id", uid).order("updated_at", { ascending: false }).limit(200), "lesson_progress + lessons join");
  return `${row.display_name} @${row.username} · ${badges.length} badges in the catalogue`;
});

await check("WRITE display_name (PATCH /api/family/me) → read back → restore", async () => {
  const before = err(await u.from("profiles").select("display_name").eq("id", uid).maybeSingle(), "read name").display_name;
  const probe = `${(before ?? "Member").slice(0, 40)} (smoke)`;
  err(await u.from("profiles").update({ display_name: probe }).eq("id", uid), "update display_name");
  cleanups.push(["profiles.display_name", async () => u.from("profiles").update({ display_name: before }).eq("id", uid)]);
  const back = err(await u.from("profiles").select("display_name, username").eq("id", uid).maybeSingle(), "read back name");
  ensure(back.display_name === probe, `read back ${back.display_name}`);
  ensure(back.username, "ensure_username left the profile without a username");
  const after = err(await u.from("profiles").select("role, family_id").eq("id", uid).maybeSingle(), "read role");
  ensure(after.role === me.role && after.family_id === FAM, "a display-name update changed role/family_id");
  return `"${before}" → "${probe}" (restored) · username @${back.username} untouched · role/family unchanged`;
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
