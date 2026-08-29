import { LEARN_XP } from "@/lib/learn/schema";
import { awardOnce, lifetimeXp } from "@/lib/learn/server";
import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/**
 * Lesson complete — byte-compatible with FTA's `completeLesson`: lesson_progress upsert (completed, 100%)
 * + one-time lesson XP keyed on (kind 'lesson', ref lessonId). Stepped lessons also pass the final
 * step index so lesson_step_progress records the finished state for resume.
 */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const { lessonId, stepTotal, timeSpentSec } = await readJson<{ lessonId?: string; stepTotal?: number; timeSpentSec?: number }>(req);
  if (!lessonId) return bad("lessonId required");
  const uid = r.session.user.id;
  try {
    const { data: lesson } = await r.supa.from("lessons").select("id, lesson_xp, steps").eq("id", lessonId).maybeSingle();
    if (!lesson) return bad("Lesson not found", 404);
    const l = lesson as { lesson_xp: number | null; steps: { xp?: number } | null };
    const xpAmount = l.steps?.xp ?? l.lesson_xp ?? LEARN_XP.LESSON;
    const before = await lifetimeXp(r.supa, uid);
    const row: Record<string, unknown> = { user_id: uid, lesson_id: lessonId, status: "completed", progress_pct: 100, completed_at: new Date().toISOString() };
    if (Number.isFinite(Number(timeSpentSec)) && Number(timeSpentSec) > 0) row.time_spent_sec = Math.round(Number(timeSpentSec));
    const { error } = await r.supa.from("lesson_progress").upsert(row, { onConflict: "user_id,lesson_id" });
    if (error) return dbError(error);
    if (typeof stepTotal === "number" && stepTotal > 0) {
      await r.supa.from("lesson_step_progress").upsert({ user_id: uid, lesson_id: lessonId, step_index: stepTotal, step_state: { done: true } }, { onConflict: "user_id,lesson_id" });
    }
    const awarded = await awardOnce(r.supa, uid, "lesson", xpAmount, lessonId);
    return ok({ xp: awarded, xpBefore: before, xpAfter: before + awarded, alreadyBanked: awarded === 0 });
  } catch (e) { return dbError(e); }
}
