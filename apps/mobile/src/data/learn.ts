/**
 * The learning path.
 *
 * Mirrors the web app's `lib/live/learning.ts` deliberately, because both read the same tables and
 * a second interpretation of "which lessons are real" would put two different paths in front of the
 * same member. Two rules carry over exactly:
 *
 *  1. The belt courses are `published = false` on purpose — that flag is what keeps them out of the
 *     frozen legacy app, whose engine renders most of our step types as "not available in your app
 *     version". They are read by name instead (`slug like belt-%`), with the RLS grant that allows it.
 *  2. A lesson is real when there is something to play: authored steps, or a video. The catalogue
 *     still carries shells from the FTA import — course rows with lesson rows and no content — and a
 *     member who taps one gets an empty screen.
 */
import { supabase } from "../lib/supabase";

export type NodeKind = "lesson" | "checkpoint" | "challenge";
export type NodeStatus = "locked" | "available" | "in_progress" | "completed";

export type PathNode = {
  id: string;
  title: string;
  index: number;
  minutes: number;
  xp: number;
  kind: NodeKind;
  status: NodeStatus;
  pct: number;
};

export type PathUnit = { id: string; title: string; blurb: string; nodes: PathNode[]; done: number };

export type LearningPath = {
  id: string; slug: string; title: string; blurb: string;
  units: PathUnit[]; total: number; done: number; pct: number;
  next: PathNode | null;
};

type CourseRow = { id: string; slug: string; title: string; description: string | null; program: string | null; sort_order: number | null };
type ModuleRow = { id: string; course_id: string; title: string; description: string | null; sort_order: number | null };
type LessonRow = {
  id: string; module_id: string; title: string; est_minutes: number | null; lesson_xp: number | null;
  node_kind: string | null; sort_order: number | null; retired: boolean | null; video_id: string | null; steps: unknown;
};
type ProgressRow = { lesson_id: string; status: string | null; progress_pct: number | null };

const minutesOf = (l: LessonRow) => l.est_minutes ?? 8;
const kindOf = (l: LessonRow): NodeKind => {
  const k = (l.node_kind ?? "").toLowerCase();
  return k.includes("checkpoint") || k.includes("quiz") ? "checkpoint" : k.includes("challenge") ? "challenge" : "lesson";
};

export async function loadPaths(userId: string | null): Promise<LearningPath[]> {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, program, sort_order")
    .or("published.eq.true,slug.like.belt-*")
    .order("sort_order");
  if (error) throw error;
  if (!courses?.length) return [];

  const ids = (courses as CourseRow[]).map((c) => c.id);
  const { data: modules } = await supabase
    .from("modules").select("id, course_id, title, description, sort_order").in("course_id", ids).order("sort_order");
  const mods = (modules ?? []) as ModuleRow[];
  if (!mods.length) return [];

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id, module_id, title, est_minutes, lesson_xp, node_kind, sort_order, retired, video_id, steps")
    .in("module_id", mods.map((m) => m.id))
    .order("sort_order");

  const lessons = ((lessonRows ?? []) as LessonRow[]).filter((l) => !l.retired && (l.steps !== null || !!l.video_id));

  let progress: ProgressRow[] = [];
  if (userId && lessons.length) {
    const { data } = await supabase.from("lesson_progress").select("lesson_id, status, progress_pct").eq("user_id", userId);
    progress = (data ?? []) as ProgressRow[];
  }
  const byLesson = new Map(progress.map((p) => [p.lesson_id, p]));

  const liveModules = mods.filter((m) => lessons.some((l) => l.module_id === m.id));
  const liveCourses = (courses as CourseRow[]).filter((c) => liveModules.some((m) => m.course_id === c.id));

  return liveCourses.map((c) => {
    let n = 0;
    // The gate is the path itself: everything up to and including the furthest node the member has
    // touched is open, and the rest is shut. Computed up front rather than while walking, because
    // real progress is messy — someone who started lesson three leaves lesson two untouched, and a
    // path that showed an open node, a locked node, then another open node would just look broken.
    const courseNodes = liveModules.filter((m) => m.course_id === c.id).flatMap((m) => lessons.filter((l) => l.module_id === m.id));
    const lastTouched = courseNodes.reduce((furthest, l, idx) => {
      const p = byLesson.get(l.id);
      return p?.status === "completed" || p?.status === "in_progress" || (p?.progress_pct ?? 0) > 0 ? idx : furthest;
    }, -1);
    const openThrough = lastTouched + 1; // the one after the furthest they reached is next up
    let seen = -1;
    const units: PathUnit[] = liveModules.filter((m) => m.course_id === c.id).map((m) => {
      const nodes: PathNode[] = lessons.filter((l) => l.module_id === m.id).map((l) => {
        const p = byLesson.get(l.id);
        n += 1;
        const done = p?.status === "completed";
        const started = !done && (p?.status === "in_progress" || (p?.progress_pct ?? 0) > 0);
        seen += 1;
        const status: NodeStatus =
          done ? "completed"
            : started ? "in_progress"
              : seen <= openThrough ? "available"
                : "locked";
        return {
          id: l.id, title: l.title, index: n, minutes: minutesOf(l), xp: l.lesson_xp ?? 50,
          kind: kindOf(l), status, pct: done ? 100 : p?.progress_pct ?? 0,
        };
      });
      return { id: m.id, title: m.title, blurb: m.description ?? "", nodes, done: nodes.filter((x) => x.status === "completed").length };
    });
    const all = units.flatMap((u) => u.nodes);
    const done = all.filter((x) => x.status === "completed").length;
    return {
      id: c.id, slug: c.slug, title: c.title, blurb: c.description ?? "", units,
      total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0,
      next: all.find((x) => x.status === "in_progress" || x.status === "available") ?? null,
    };
  });
}

/* ── XP, streak and the belt ── */

export type LearnerState = { xp: number; streak: number; todayXp: number; beltLevel: number };

export async function loadLearnerState(userId: string): Promise<LearnerState> {
  const [{ data: xpRows }, { data: awards }] = await Promise.all([
    supabase.from("xp_events").select("amount, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
    supabase.from("fic_belt_awards").select("belt_level").eq("user_id", userId).order("belt_level", { ascending: false }).limit(1),
  ]);
  const rows = (xpRows ?? []) as { amount: number; created_at: string }[];
  const xp = rows.reduce((a, r) => a + (r.amount ?? 0), 0);

  const dayOf = (iso: string) => iso.slice(0, 10);
  const days = new Set(rows.map((r) => dayOf(r.created_at)));
  const today = new Date().toISOString().slice(0, 10);
  const todayXp = rows.filter((r) => dayOf(r.created_at) === today).reduce((a, r) => a + (r.amount ?? 0), 0);

  // A streak survives today being empty — the day is not over yet. It breaks on a missed yesterday.
  let streak = 0;
  const cursor = new Date();
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { xp, streak, todayXp, beltLevel: (awards?.[0] as { belt_level: number } | undefined)?.belt_level ?? 1 };
}
