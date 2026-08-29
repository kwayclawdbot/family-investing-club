import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/courses/publish { lessonId, action: 'publish'|'unpublish' } — FTA `publish_lesson_draft` / `unpublish_lesson_draft` (steps_draft → steps). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ lessonId?: string; action?: string }>(req);
  if (!b.lessonId) return bad("lessonId required");
  if (b.action !== "publish" && b.action !== "unpublish") return bad("action must be publish or unpublish");
  const { error } = await r.supa.rpc(b.action === "publish" ? "publish_lesson_draft" : "unpublish_lesson_draft", { p_lesson_id: b.lessonId });
  if (error) return dbError(error);
  return ok({ action: b.action });
}
