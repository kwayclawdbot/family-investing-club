import "server-only";
import type { Flashcard, LearningPath, Lesson, LiveSession } from "@/lib/types";
import { continueLesson as fxContinue } from "@/lib/fixtures";
import { deriveRegister, parseLessonSteps, type Register } from "@/lib/learn/schema";
import { resolveLegacyVideoId } from "@/lib/learn/legacy";
import type { CourseDetail, CourseLesson, CourseModule, CourseSummary, LearnHubData, LessonData, LessonStatus, LiveItem, QuizQuestion, RecordingKind, ReviewDeck, SkillRow } from "@/lib/learn/types";
import { getSession, isAdmin, type Session } from "./session";
import { must, safe, userClient } from "./supa";

/* ── Row shapes (verified against information_schema on 2026-08-28; the DB is the truth) ── */
type Course = { id: string; slug: string; title: string; description: string | null; program: string | null; published: boolean; sort_order: number | null; min_tier: string | null };
type Module = { id: string; course_id: string; title: string; description: string | null; sort_order: number | null };
type LessonRow = { id: string; module_id: string; title: string; est_minutes: number | null; lesson_xp: number | null; node_kind: string | null; sort_order: number | null; retired: boolean | null; has_quiz: boolean | null; is_free: boolean | null; video_duration_sec: number | null };
type Progress = { lesson_id: string; status: string | null; progress_pct: number | null };
type SessionRow = { id: string; title: string; description: string | null; scheduled_at: string; duration_min: number | null; status: string | null; host_name: string | null; host_title: string | null; recording_url: string | null; recording_path: string | null; recording_kind: string | null; class_type: string | null; track: string | null; zoom_join_url: string | null; worksheet_url: string | null; assignment: string | null; min_tier: string | null };
type EventRow = { id: string; status: string | null; room_type: string | null; title: string; description: string | null; tickers: string[] | null; host_name: string | null; starts_at: string | null; duration_min: number | null; join_url: string | null; replay_url: string | null; viewer_count: number | null; interested_count: number | null };

const RECORDINGS_BUCKET = "class-recordings";
const SIGNED_URL_TTL = 60 * 60;

/* ── Entitlement (FTA lesson-page rule): academy → fta · challenge → fta|fic · free → is_free sampler only ── */
export function courseLocked(minTier: string | null, s: Session | null): boolean {
  if (!s || isAdmin(s)) return false;
  const tier = s.tier ?? "fic";
  if (tier === "free") return true; // sampler: only is_free lessons open (enforced per lesson)
  if (minTier === "academy") return tier !== "fta";
  return false;
}
function lessonLockReason(l: { is_free: boolean | null }, program: string | null, minTier: string | null, s: Session): string | null {
  if (isAdmin(s)) return null;
  const tier = s.tier ?? "fic";
  if (tier === "free" || s.clubLapsed) {
    const ftaPreserved = s.clubLapsed && tier !== "free" && program === "fta";
    if (!ftaPreserved && !l.is_free) return tier === "free" ? "This lesson is part of the full program. Your free membership includes the sampler lessons." : "Your club access has lapsed — this lesson is part of the club program.";
    return null;
  }
  if (minTier === "academy" && tier !== "fta") return "This course is part of the FTA academy program.";
  return null;
}

async function loadCurriculum(userId: string | null) {
  const supa = await userClient();
  const courses = (must(await supa.from("courses").select("id, slug, title, description, program, published, sort_order, min_tier").eq("published", true).order("sort_order")) as Course[]);
  if (!courses.length) return null;
  const ids = courses.map((c) => c.id);
  const modules = must(await supa.from("modules").select("id, course_id, title, description, sort_order").in("course_id", ids).order("sort_order")) as Module[];
  const lessons = modules.length ? (must(await supa.from("lessons").select("id, module_id, title, est_minutes, lesson_xp, node_kind, sort_order, retired, has_quiz, is_free, video_duration_sec").in("module_id", modules.map((m) => m.id)).order("sort_order")) as LessonRow[]).filter((l) => !l.retired) : [];
  const [progress, stepped] = await Promise.all([
    userId && lessons.length ? supa.from("lesson_progress").select("lesson_id, status, progress_pct").eq("user_id", userId) : Promise.resolve({ data: [] as Progress[] }),
    lessons.length ? supa.from("lessons").select("id").not("steps", "is", null) : Promise.resolve({ data: [] as { id: string }[] }),
  ]);
  return { courses, modules, lessons, progress: (progress.data ?? []) as Progress[], stepped: new Set(((stepped.data ?? []) as { id: string }[]).map((r) => r.id)) };
}
type Curriculum = NonNullable<Awaited<ReturnType<typeof loadCurriculum>>>;

const statusOf = (p: Progress | undefined): LessonStatus => (p?.status === "completed" ? "completed" : p?.status === "in_progress" || (p?.progress_pct ?? 0) > 0 ? "in_progress" : "not_started");
const minutesOf = (l: LessonRow) => l.est_minutes ?? (l.video_duration_sec ? Math.max(1, Math.round(l.video_duration_sec / 60)) : 8);
const kindOf = (l: LessonRow): CourseLesson["kind"] => { const k = (l.node_kind ?? "").toLowerCase(); return k.includes("checkpoint") || k.includes("quiz") ? "checkpoint" : k.includes("challenge") ? "challenge" : "lesson"; };

function toCourseLessons(c: Course, cur: Curriculum): { modules: CourseModule[]; all: CourseLesson[] } {
  const byLesson = new Map(cur.progress.map((p) => [p.lesson_id, p]));
  let n = 0;
  const modules: CourseModule[] = cur.modules.filter((m) => m.course_id === c.id).map((m) => {
    const lessons: CourseLesson[] = cur.lessons.filter((l) => l.module_id === m.id).map((l) => {
      const p = byLesson.get(l.id);
      n += 1;
      return { id: l.id, title: l.title, index: n, minutes: minutesOf(l), xp: l.lesson_xp ?? 50, status: statusOf(p), pct: p?.status === "completed" ? 100 : p?.progress_pct ?? 0, kind: kindOf(l), stepped: cur.stepped.has(l.id), hasQuiz: !!l.has_quiz, isFree: !!l.is_free };
    });
    return { id: m.id, title: m.title, blurb: m.description ?? "", lessons, done: lessons.filter((x) => x.status === "completed").length };
  });
  return { modules, all: modules.flatMap((m) => m.lessons) };
}

function toSummary(c: Course, cur: Curriculum): CourseSummary {
  const { modules, all } = toCourseLessons(c, cur);
  const done = all.filter((l) => l.status === "completed").length;
  const next = all.find((l) => l.status !== "completed") ?? null;
  return { id: c.id, slug: c.slug, title: c.title, blurb: c.description ?? "", program: c.program, minTier: c.min_tier, lessons: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0, modules: modules.length, nextLessonId: next?.id ?? null, nextLessonTitle: next?.title ?? null };
}

/* ── Legacy LearningPath shape (Library / data-live) ── */
function toPath(c: Course, cur: Curriculum, s: Session | null): LearningPath {
  const { modules, all } = toCourseLessons(c, cur);
  const doneCount = all.filter((l) => l.status === "completed").length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
  const nextIdx = all.findIndex((l) => l.status !== "completed");
  const locked = courseLocked(c.min_tier, s);
  const status: LearningPath["status"] = pct === 100 && all.length ? "done" : locked ? "locked" : doneCount > 0 ? "active" : "available";
  let seenNext = false;
  const lessonList: Lesson[] = all.map((l) => {
    let st: Lesson["status"] = l.status === "completed" ? "done" : "locked";
    if (l.status !== "completed" && !seenNext) { st = "next"; seenNext = true; }
    if (l.kind === "checkpoint") st = l.status === "completed" ? "checkpoint" : st;
    if (l.kind === "challenge") st = "challenge";
    return { id: l.id, title: l.title, index: l.index, status: st, minutes: l.minutes, subtitle: st === "next" ? `Lesson ${l.index} · Up next` : `Lesson ${l.index}` };
  });
  return {
    slug: c.slug, title: c.title, lessons: all.length, checkpoints: all.filter((l) => l.kind === "checkpoint").length,
    units: modules.map((m) => ({ id: m.id, title: m.title, lessons: m.lessons.length, blurb: m.blurb })),
    hours: +(all.reduce((a, l) => a + l.minutes, 0) / 60).toFixed(1),
    blurb: c.description ?? "", progress: pct, status, elective: (c.program ?? "").toLowerCase() === "fta" || c.min_tier === "academy" || undefined,
    nextLesson: nextIdx >= 0 ? nextIdx + 1 : undefined,
    xp: all.reduce((a, l) => a + l.xp, 0), concepts: modules.length * 3, badges: 1, lessonList,
  };
}

export async function getPaths(): Promise<LearningPath[] | null> {
  const s = await getSession();
  return safe("learning.getPaths", async () => {
    const cur = await loadCurriculum(s?.user.id ?? null);
    if (!cur) return null;
    return cur.courses.map((c) => toPath(c, cur, s));
  });
}

export async function getPath(slug: string): Promise<LearningPath | null> {
  const paths = await getPaths();
  return paths?.find((p) => p.slug === slug) ?? null;
}

/** Published courses with the member's progress — the Courses tab + library. */
export async function getCourses(): Promise<CourseSummary[] | null> {
  const s = await getSession();
  return safe("learning.getCourses", async () => {
    const cur = await loadCurriculum(s?.user.id ?? null);
    if (!cur) return null;
    return cur.courses.map((c) => toSummary(c, cur));
  });
}

/** One course → modules → lessons with per-lesson status. */
export async function getCourse(slug: string): Promise<CourseDetail | null> {
  const s = await getSession();
  return safe("learning.getCourse", async () => {
    const cur = await loadCurriculum(s?.user.id ?? null);
    const c = cur?.courses.find((x) => x.slug === slug);
    if (!cur || !c) return null;
    const { modules, all } = toCourseLessons(c, cur);
    const done = all.filter((l) => l.status === "completed").length;
    return {
      id: c.id, slug: c.slug, title: c.title, blurb: c.description ?? "", program: c.program, minTier: c.min_tier, modules,
      lessons: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0,
      minutes: all.reduce((a, l) => a + l.minutes, 0), xp: all.reduce((a, l) => a + l.xp, 0),
      nextLesson: all.find((l) => l.status !== "completed") ?? all[0] ?? null,
    };
  });
}

export async function getContinueLesson(): Promise<typeof fxContinue | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("learning.getContinueLesson", async () => {
    const cur = await loadCurriculum(s.user.id);
    if (!cur) return null;
    const sums = cur.courses.map((c) => toSummary(c, cur));
    // Most recently touched course first, then the first course with something left.
    const recent = await (await userClient()).from("lesson_progress").select("lesson_id, updated_at").eq("user_id", s.user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    const recentCourse = recent.data ? cur.courses.find((c) => cur.modules.some((m) => m.course_id === c.id && cur.lessons.some((l) => l.module_id === m.id && l.id === (recent.data as { lesson_id: string }).lesson_id))) : null;
    const pick = (recentCourse && sums.find((x) => x.id === recentCourse.id && x.nextLessonId)) ?? sums.find((x) => x.done > 0 && x.nextLessonId) ?? sums.find((x) => x.nextLessonId);
    if (!pick || !pick.nextLessonId) return null;
    const { all } = toCourseLessons(cur.courses.find((c) => c.id === pick.id)!, cur);
    const next = all.find((l) => l.id === pick.nextLessonId)!;
    return { pathTitle: pick.title, pathSlug: pick.slug, lessonNo: next.index, lessonTotal: pick.lessons, title: next.title, minutes: next.minutes, progress: pick.pct, lessonId: next.id };
  });
}

/* ── Lesson player data ── */
type LessonFull = LessonRow & { description: string | null; video_provider: string | null; video_id: string | null; steps: unknown | null };

export async function getLessonData(id: string): Promise<LessonData | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("learning.getLessonData", async () => {
    const supa = await userClient();
    const row = must(await supa.from("lessons").select("id, module_id, title, description, video_provider, video_id, video_duration_sec, est_minutes, lesson_xp, node_kind, sort_order, retired, has_quiz, is_free, steps").eq("id", id).maybeSingle()) as LessonFull | null;
    if (!row) return null;
    const mod = must(await supa.from("modules").select("id, course_id, title, description, sort_order").eq("id", row.module_id).maybeSingle()) as Module | null;
    const course = mod ? (must(await supa.from("courses").select("id, slug, title, description, program, published, sort_order, min_tier").eq("id", mod.course_id).maybeSingle()) as Course | null) : null;
    if (!mod || !course) return null;
    const siblingsMods = must(await supa.from("modules").select("id, course_id, title, description, sort_order").eq("course_id", course.id).order("sort_order")) as Module[];
    const siblings = (must(await supa.from("lessons").select("id, module_id, title, est_minutes, lesson_xp, node_kind, sort_order, retired, has_quiz, is_free, video_duration_sec").in("module_id", siblingsMods.map((m) => m.id)).order("sort_order")) as LessonRow[]).filter((l) => !l.retired);
    const ordered = siblingsMods.flatMap((m) => siblings.filter((l) => l.module_id === m.id));
    const idx = ordered.findIndex((l) => l.id === row.id);
    const [prog, step, quiz, res, xp, quizPass] = await Promise.all([
      supa.from("lesson_progress").select("lesson_id, status, progress_pct").eq("user_id", s.user.id).eq("lesson_id", row.id).maybeSingle(),
      supa.from("lesson_step_progress").select("step_index").eq("user_id", s.user.id).eq("lesson_id", row.id).maybeSingle(),
      supa.from("quizzes").select("id, questions, passing_score").eq("lesson_id", row.id).maybeSingle(),
      supa.from("lesson_resources").select("id, type, title, description, video_provider, video_id, file_url, file_name, external_url, sort_order").eq("lesson_id", row.id).order("sort_order"),
      supa.from("xp_events").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).eq("kind", "lesson").eq("ref_id", row.id),
      supa.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).eq("passed", true),
    ]);
    const xpBase = row.lesson_xp ?? 50;
    const stepped = parseLessonSteps(row.steps, { title: row.title, xp: xpBase });
    const q = quiz.data as { id: string; questions: unknown; passing_score: number | null } | null;
    const questions = Array.isArray(q?.questions) ? (q!.questions as QuizQuestion[]).filter((x) => x && Array.isArray(x.options) && typeof x.correctIndex === "number") : [];
    const provider = (["youtube", "html", "bunny", "mux"] as const).find((p) => p === row.video_provider) ?? null;
    const register: Register = deriveRegister(s.profile);
    const p = prog.data as Progress | null;
    return {
      id: row.id, title: row.title, description: row.description, courseSlug: course.slug, courseTitle: course.title, moduleTitle: mod.title,
      lessonNo: idx + 1, lessonTotal: ordered.length, estMinutes: stepped?.duration_minutes ?? minutesOf(row), xp: stepped?.xp ?? xpBase, isFree: !!row.is_free,
      stepped, videoProvider: provider, videoId: resolveLegacyVideoId(provider, row.video_id), videoDurationSec: row.video_duration_sec,
      quiz: q && questions.length ? { id: q.id, questions, passingScore: q.passing_score ?? 70 } : null,
      resources: ((res.data ?? []) as { id: string; type: string | null; title: string; description: string | null; video_provider: string | null; video_id: string | null; file_url: string | null; file_name: string | null; external_url: string | null }[]).map((r) => ({ id: r.id, type: r.type, title: r.title, description: r.description, fileUrl: r.file_url, fileName: r.file_name, externalUrl: r.external_url, videoProvider: r.video_provider, videoId: r.video_id })),
      progress: { status: statusOf(p ?? undefined), pct: p?.status === "completed" ? 100 : p?.progress_pct ?? 0 },
      resumeStep: (step.data as { step_index: number } | null)?.step_index ?? 0,
      xpBanked: (xp.count ?? 0) > 0,
      quizPassed: (quizPass.count ?? 0) > 0 && !!q,
      register,
      prev: idx > 0 ? { id: ordered[idx - 1].id, title: ordered[idx - 1].title } : null,
      next: idx >= 0 && idx < ordered.length - 1 ? { id: ordered[idx + 1].id, title: ordered[idx + 1].title } : null,
      locked: lessonLockReason(row, course.program, course.min_tier, s),
    };
  });
}

/* ── Flashcards / review ── */
export async function getFlashcards(): Promise<Flashcard[] | null> {
  return safe("learning.getFlashcards", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("flashcards").select("id, front, back, set_slug, track").limit(40)) as { id: string; front: string; back: string; set_slug: string | null; track: string | null }[];
    if (!rows.length) return null;
    return rows.map((r) => ({ id: r.id, term: r.front, definition: r.back, concept: r.set_slug ?? r.track ?? "Concept", pathSlug: r.track ?? "money-basics" }));
  });
}

const trackOf = (r: Register) => (r === "kid" ? "kids" : r === "teen" ? "teens" : "adults");
const today = () => new Date().toISOString().slice(0, 10);

/** Due cards for the member's track: never-reviewed first-week cards + anything whose due_at has passed. */
export async function getReviewDeck(limit = 20): Promise<ReviewDeck | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("learning.getReviewDeck", async () => {
    const supa = await userClient();
    const track = trackOf(deriveRegister(s.profile));
    const [cards, reviews, xp] = await Promise.all([
      supa.from("flashcards").select("id, front, back, set_slug, track, week, visual").eq("track", track).order("week", { ascending: true, nullsFirst: false }),
      supa.from("flashcard_reviews").select("card_id, due_at, streak, updated_at").eq("user_id", s.user.id),
      supa.from("xp_events").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).eq("kind", "flashcards").eq("ref_id", `fc:${today()}`),
    ]);
    const all = must(cards) as { id: string; front: string; back: string; set_slug: string | null; track: string | null; week: number | null; visual: unknown | null }[];
    if (!all.length) return null;
    const rv = new Map(((reviews.data ?? []) as { card_id: string; due_at: string | null; streak: number | null; updated_at: string }[]).map((r) => [r.card_id, r]));
    const d = today();
    const due = all.filter((c) => { const r = rv.get(c.id); return !r || !r.due_at || r.due_at <= d; });
    const reviewedToday = [...rv.values()].filter((r) => r.updated_at.slice(0, 10) === d).length;
    // Prioritise reviewed-and-due (spaced repetition) over never-seen, then by week.
    const ordered = [...due.filter((c) => rv.has(c.id)), ...due.filter((c) => !rv.has(c.id))].slice(0, limit);
    return {
      track,
      dueCount: due.length,
      reviewedToday,
      xpToday: (xp.count ?? 0) > 0,
      cards: ordered.map((c) => ({ id: c.id, front: c.front, back: c.back, set: c.set_slug ?? "foundations", track: c.track ?? track, visual: c.visual, due: true, streak: rv.get(c.id)?.streak ?? 0 })),
    };
  });
}

export async function getSkills(): Promise<SkillRow[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("learning.getSkills", async () => {
    const supa = await userClient();
    const [skills, mastery] = await Promise.all([
      supa.from("skills").select("id, name, domain, sort").order("sort"),
      supa.from("skill_mastery").select("skill_id, mastery_score, attempts, next_review_at").eq("user_id", s.user.id),
    ]);
    const m = new Map(((mastery.data ?? []) as { skill_id: string; mastery_score: number | null; attempts: number | null; next_review_at: string | null }[]).map((r) => [r.skill_id, r]));
    const rows = (must(skills) as { id: string; name: string; domain: string | null }[]).map<SkillRow>((k) => ({ id: k.id, name: k.name, domain: k.domain ?? "", score: m.get(k.id)?.mastery_score ?? 0, attempts: m.get(k.id)?.attempts ?? 0, nextReviewAt: m.get(k.id)?.next_review_at ?? null }));
    return rows.length ? rows : null;
  });
}

/* ── Live: live_sessions (classes, recordings) + live_events (rooms) + session_rsvps ── */
function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(?:^|\.)(?:youtube\.com|youtu\.be|youtube-nocookie\.com)$/i.test(u.hostname)) return null;
    let id = "";
    if (u.hostname.replace(/^www\./, "") === "youtu.be") id = u.pathname.split("/").filter(Boolean)[0] ?? "";
    else if (u.searchParams.get("v")) id = u.searchParams.get("v") ?? "";
    else { const m = u.pathname.match(/\/(?:live|shorts|embed)\/([^/?#]+)/); if (m) id = m[1]; }
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch { return null; }
}
function recordingKind(r: SessionRow): RecordingKind | null {
  if (r.recording_kind === "upload" || r.recording_kind === "youtube" || r.recording_kind === "external") return r.recording_kind;
  if (r.recording_path) return "upload";
  if (r.recording_url) return youtubeEmbed(r.recording_url) ? "youtube" : "external";
  return null;
}
function sessionStatus(r: SessionRow, hasRecording: boolean): LiveItem["status"] {
  const st = (r.status ?? "").toLowerCase();
  const past = new Date(r.scheduled_at).getTime() + (r.duration_min ?? 60) * 60000 < Date.now();
  if (st === "live") return "live";
  if (hasRecording) return "recorded";
  if (st === "completed" || st === "cancelled" || past) return "past";
  return "upcoming";
}
function sessionToItem(r: SessionRow, rsvps: { session_id: string; user_id: string }[], me: string | null): LiveItem {
  const kind = recordingKind(r);
  return {
    id: r.id, kind: "session", title: r.title, blurb: r.description ?? "", host: r.host_name ?? "FIC Coach", hostTitle: r.host_title,
    startsAt: r.scheduled_at, minutes: r.duration_min ?? 60, status: sessionStatus(r, !!kind), track: r.track ?? "all", classType: r.class_type,
    joinUrl: r.zoom_join_url, rsvped: !!me && rsvps.some((x) => x.session_id === r.id && x.user_id === me), rsvpCount: rsvps.filter((x) => x.session_id === r.id).length, viewers: 0,
    recording: kind ? { kind, embedUrl: kind === "youtube" && r.recording_url ? youtubeEmbed(r.recording_url) : null, url: kind === "upload" ? null : r.recording_url } : null,
    worksheetUrl: r.worksheet_url, assignment: r.assignment, minTier: r.min_tier, tickers: [],
  };
}
function eventToItem(e: EventRow): LiveItem {
  const st = (e.status ?? "").toLowerCase();
  const status: LiveItem["status"] = st === "live" || st === "starting_soon" ? "live" : st === "replay_ready" && e.replay_url ? "recorded" : st === "ended" ? "past" : "upcoming";
  return {
    id: e.id, kind: "event", title: e.title, blurb: e.description ?? "", host: e.host_name ?? "FIC Coach", hostTitle: null,
    startsAt: e.starts_at ?? new Date().toISOString(), minutes: e.duration_min ?? 60, status, track: "all", classType: e.room_type,
    joinUrl: e.join_url, rsvped: false, rsvpCount: e.interested_count ?? 0, viewers: e.viewer_count ?? 0,
    recording: e.replay_url ? { kind: youtubeEmbed(e.replay_url) ? "youtube" : "external", embedUrl: youtubeEmbed(e.replay_url), url: e.replay_url } : null,
    worksheetUrl: null, assignment: null, minTier: null, tickers: e.tickers ?? [],
  };
}

const SESSION_COLS = "id, title, description, scheduled_at, duration_min, status, host_name, host_title, recording_url, recording_path, recording_kind, class_type, track, zoom_join_url, worksheet_url, assignment, min_tier";
const EVENT_COLS = "id, status, room_type, title, description, tickers, host_name, starts_at, duration_min, join_url, replay_url, viewer_count, interested_count";

export async function getLiveItems(): Promise<LiveItem[] | null> {
  const s = await getSession();
  return safe("learning.getLiveItems", async () => {
    const supa = await userClient();
    const [sessions, events, rsvps] = await Promise.all([
      supa.from("live_sessions").select(SESSION_COLS).order("scheduled_at", { ascending: false }).limit(60),
      supa.from("live_events").select(EVENT_COLS).order("starts_at", { ascending: false }).limit(30),
      supa.from("session_rsvps").select("session_id, user_id"),
    ]);
    const rows = (must(sessions) as SessionRow[]).map((r) => sessionToItem(r, (rsvps.data ?? []) as { session_id: string; user_id: string }[], s?.user.id ?? null));
    const evs = ((events.data ?? []) as EventRow[]).map(eventToItem);
    const all = [...rows, ...evs].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    return all.length ? all : null;
  });
}

/** One session/event with a fresh signed URL for an uploaded recording (private bucket, 1h). */
export async function getLiveItem(id: string): Promise<LiveItem | null> {
  const s = await getSession();
  return safe("learning.getLiveItem", async () => {
    const supa = await userClient();
    const [sess, ev, rsvps] = await Promise.all([
      supa.from("live_sessions").select(SESSION_COLS).eq("id", id).maybeSingle(),
      supa.from("live_events").select(EVENT_COLS).eq("id", id).maybeSingle(),
      supa.from("session_rsvps").select("session_id, user_id").eq("session_id", id),
    ]);
    if (sess.data) {
      const r = sess.data as SessionRow;
      const item = sessionToItem(r, (rsvps.data ?? []) as { session_id: string; user_id: string }[], s?.user.id ?? null);
      if (item.recording?.kind === "upload" && r.recording_path && s) {
        const signed = await supa.storage.from(RECORDINGS_BUCKET).createSignedUrl(r.recording_path, SIGNED_URL_TTL);
        item.recording.url = signed.data?.signedUrl ?? null;
      }
      return item;
    }
    if (ev.data) return eventToItem(ev.data as EventRow);
    return null;
  });
}

/* Legacy LiveSession shape for data-live (kept for the demo path + any older screen). */
export async function getLiveSessions(): Promise<LiveSession[] | null> {
  const items = await getLiveItems();
  if (!items) return null;
  return items.map((r) => ({ id: r.id, title: r.title, instructor: r.host, level: "All", startsAt: r.startsAt, minutes: r.minutes, status: r.status === "past" ? "recorded" : r.status, concepts: [r.classType ?? "Class"].filter(Boolean), blurb: r.blurb, watching: r.viewers || undefined }));
}
export async function getLiveSession(id: string): Promise<LiveSession | null> {
  const all = await getLiveSessions();
  return all?.find((s) => s.id === id) ?? null;
}

/* ── Learn hub composite ── */
export async function getLearnHub(): Promise<LearnHubData | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("learning.getLearnHub", async () => {
    const supa = await userClient();
    const [courses, cont, live, deck, skills, xp, done] = await Promise.all([
      getCourses(), getContinueLesson(), getLiveItems(), getReviewDeck(1), getSkills(),
      supa.from("xp_events").select("amount, created_at").eq("user_id", s.user.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      supa.from("lesson_progress").select("completed_at").eq("user_id", s.user.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(60),
    ]);
    if (!courses) return null;
    const days = new Set(((done.data ?? []) as { completed_at: string | null }[]).map((r) => (r.completed_at ?? "").slice(0, 10)).filter(Boolean));
    let streak = 0;
    for (let i = 0; i < 60; i++) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); if (days.has(d)) streak += 1; else if (i > 0) break; }
    const items = live ?? [];
    return {
      streak,
      continueLesson: cont ? { lessonId: cont.lessonId, title: cont.title, courseTitle: cont.pathTitle, courseSlug: cont.pathSlug, lessonNo: cont.lessonNo, lessonTotal: cont.lessonTotal, minutes: cont.minutes, pct: cont.progress } : null,
      courses,
      live: { now: items.filter((i) => i.status === "live"), upcoming: items.filter((i) => i.status === "upcoming").sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 5), recordings: items.filter((i) => i.status === "recorded").slice(0, 5) },
      review: { due: deck?.dueCount ?? 0, weak: (skills ?? []).filter((k) => k.attempts > 0).sort((a, b) => a.score - b.score).slice(0, 4) },
      xpWeek: ((xp.data ?? []) as { amount: number }[]).reduce((a, r) => a + (r.amount ?? 0), 0),
      lessonsDone: (done.data ?? []).length,
    };
  });
}
