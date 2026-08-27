import "server-only";
import type { Flashcard, LearningPath, Lesson, LiveSession } from "@/lib/types";
import { continueLesson as fxContinue } from "@/lib/fixtures";
import { getSession } from "./session";
import { must, safe, userClient } from "./supa";

type Course = { id: string; slug: string; title: string; description: string | null; program: string | null; published: boolean; sort_order: number | null };
type Module = { id: string; course_id: string; title: string; description: string | null; sort_order: number | null };
type LessonRow = { id: string; module_id: string; title: string; est_minutes: number | null; lesson_xp: number | null; node_kind: string | null; sort_order: number | null; retired: boolean | null };
type Progress = { lesson_id: string; status: string | null; progress_pct: number | null };

async function loadCurriculum(userId: string | null) {
  const supa = await userClient();
  const courses = (must(await supa.from("courses").select("id, slug, title, description, program, published, sort_order").eq("published", true).order("sort_order")) as Course[]);
  if (!courses.length) return null;
  const ids = courses.map((c) => c.id);
  const modules = must(await supa.from("modules").select("id, course_id, title, description, sort_order").in("course_id", ids).order("sort_order")) as Module[];
  const lessons = modules.length ? (must(await supa.from("lessons").select("id, module_id, title, est_minutes, lesson_xp, node_kind, sort_order, retired").in("module_id", modules.map((m) => m.id)).order("sort_order")) as LessonRow[]).filter((l) => !l.retired) : [];
  const progress = userId && lessons.length ? ((await supa.from("lesson_progress").select("lesson_id, status, progress_pct").eq("user_id", userId)).data ?? []) as Progress[] : [];
  return { courses, modules, lessons, progress };
}

function toPath(c: Course, modules: Module[], lessons: LessonRow[], progress: Progress[], idx: number, prevDone: boolean): LearningPath {
  const mods = modules.filter((m) => m.course_id === c.id);
  const ls = mods.flatMap((m) => lessons.filter((l) => l.module_id === m.id));
  const done = new Set(progress.filter((p) => p.status === "completed").map((p) => p.lesson_id));
  const doneCount = ls.filter((l) => done.has(l.id)).length;
  const pct = ls.length ? Math.round((doneCount / ls.length) * 100) : 0;
  const nextIdx = ls.findIndex((l) => !done.has(l.id));
  const status: LearningPath["status"] = pct === 100 && ls.length ? "done" : doneCount > 0 ? "active" : idx === 0 || prevDone ? "available" : "locked";
  let seenNext = false;
  const lessonList: Lesson[] = ls.map((l, i) => {
    const isDone = done.has(l.id);
    const kind = (l.node_kind ?? "").toLowerCase();
    let st: Lesson["status"] = isDone ? "done" : "locked";
    if (!isDone && !seenNext) { st = "next"; seenNext = true; }
    if (kind.includes("checkpoint") || kind.includes("quiz")) st = isDone ? "checkpoint" : st;
    if (kind.includes("challenge")) st = "challenge";
    return { id: l.id, title: l.title, index: i + 1, status: st, minutes: l.est_minutes ?? undefined, subtitle: st === "next" ? `Lesson ${i + 1} · Up next` : `Lesson ${i + 1}` };
  });
  return {
    slug: c.slug, title: c.title, lessons: ls.length, checkpoints: ls.filter((l) => (l.node_kind ?? "").toLowerCase().includes("checkpoint")).length,
    units: mods.map((m) => ({ id: m.id, title: m.title, lessons: lessons.filter((l) => l.module_id === m.id).length, blurb: m.description ?? "" })),
    hours: +(ls.reduce((a, l) => a + (l.est_minutes ?? 8), 0) / 60).toFixed(1),
    blurb: c.description ?? "", progress: pct, status, elective: (c.program ?? "").toLowerCase().includes("elective") || undefined,
    nextLesson: nextIdx >= 0 ? nextIdx + 1 : undefined,
    xp: ls.reduce((a, l) => a + (l.lesson_xp ?? 10), 0), concepts: mods.length * 3, badges: 1, lessonList,
  };
}

export async function getPaths(): Promise<LearningPath[] | null> {
  const s = await getSession();
  return safe("learning.getPaths", async () => {
    const cur = await loadCurriculum(s?.user.id ?? null);
    if (!cur) return null;
    let prevDone = true;
    return cur.courses.map((c, i) => { const p = toPath(c, cur.modules, cur.lessons, cur.progress, i, prevDone); prevDone = p.status === "done"; return p; });
  });
}

export async function getPath(slug: string): Promise<LearningPath | null> {
  const paths = await getPaths();
  return paths?.find((p) => p.slug === slug) ?? null;
}

export async function getContinueLesson(): Promise<typeof fxContinue | null> {
  const paths = await getPaths();
  if (!paths) return null;
  const p = paths.find((x) => x.status === "active") ?? paths.find((x) => x.status === "available");
  if (!p || !p.lessonList) return null;
  const next = p.lessonList.find((l) => l.status === "next") ?? p.lessonList[0];
  if (!next) return null;
  return { pathTitle: p.title, pathSlug: p.slug, lessonNo: next.index, lessonTotal: p.lessons, title: next.title, minutes: next.minutes ?? 8, progress: p.progress, lessonId: next.id };
}

export async function getFlashcards(): Promise<Flashcard[] | null> {
  return safe("learning.getFlashcards", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("flashcards").select("id, front, back, set_slug, track").limit(40)) as { id: string; front: string; back: string; set_slug: string | null; track: string | null }[];
    if (!rows.length) return null;
    return rows.map((r) => ({ id: r.id, term: r.front, definition: r.back, concept: r.set_slug ?? r.track ?? "Concept", pathSlug: r.track ?? "money-basics" }));
  });
}

export async function getLiveSessions(): Promise<LiveSession[] | null> {
  return safe("learning.getLiveSessions", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("live_sessions").select("id, title, description, scheduled_at, duration_min, status, host_name, recording_url, class_type, track").order("scheduled_at", { ascending: false }).limit(20)) as { id: string; title: string; description: string | null; scheduled_at: string; duration_min: number | null; status: string | null; host_name: string | null; recording_url: string | null; class_type: string | null; track: string | null }[];
    if (!rows.length) return null;
    const now = Date.now();
    return rows.map((r) => {
      const st = (r.status ?? "").toLowerCase();
      const status: LiveSession["status"] = st.includes("live") ? "live" : r.recording_url || new Date(r.scheduled_at).getTime() < now ? "recorded" : "upcoming";
      return { id: r.id, title: r.title, instructor: r.host_name ?? "FIC Coach", level: "All", startsAt: r.scheduled_at, minutes: r.duration_min ?? 45, status, concepts: [r.class_type ?? "Class"].filter(Boolean), blurb: r.description ?? "" };
    });
  });
}

export async function getLiveSession(id: string): Promise<LiveSession | null> {
  const all = await getLiveSessions();
  return all?.find((s) => s.id === id) ?? null;
}
