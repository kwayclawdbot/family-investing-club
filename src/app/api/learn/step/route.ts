import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/** Resume position for a stepped lesson (lesson_step_progress; `touch_lesson_step_progress` trigger stamps updated_at). */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const { lessonId, stepIndex, stepState } = await readJson<{ lessonId?: string; stepIndex?: number; stepState?: Record<string, unknown> }>(req);
  if (!lessonId) return bad("lessonId required");
  const idx = Math.max(0, Math.round(Number(stepIndex ?? 0)));
  if (!Number.isFinite(idx)) return bad("stepIndex must be a number");
  try {
    const { error } = await r.supa.from("lesson_step_progress").upsert({ user_id: r.session.user.id, lesson_id: lessonId, step_index: idx, step_state: stepState && typeof stepState === "object" ? stepState : {} }, { onConflict: "user_id,lesson_id" });
    if (error) return dbError(error);
    return ok({ stepIndex: idx });
  } catch (e) { return dbError(e); }
}
