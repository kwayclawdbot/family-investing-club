import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/** Section progress (legacy viewer + iframe bridge `section`). Monotonic; never downgrades a completed lesson. */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const { lessonId, pct } = await readJson<{ lessonId?: string; pct?: number }>(req);
  if (!lessonId) return bad("lessonId required");
  const p = Math.max(0, Math.min(100, Math.round(Number(pct ?? 0))));
  if (!Number.isFinite(p)) return bad("pct must be 0–100");
  try {
    const { data: existing } = await r.supa.from("lesson_progress").select("status, progress_pct").eq("user_id", r.session.user.id).eq("lesson_id", lessonId).maybeSingle();
    const ex = existing as { status: string | null; progress_pct: number | null } | null;
    if (ex?.status === "completed") return ok({ status: "completed", pct: 100 });
    if (ex && (ex.progress_pct ?? 0) >= p) return ok({ status: ex.status ?? "in_progress", pct: ex.progress_pct ?? 0 });
    const { error } = await r.supa.from("lesson_progress").upsert({ user_id: r.session.user.id, lesson_id: lessonId, status: "in_progress", progress_pct: p }, { onConflict: "user_id,lesson_id" });
    if (error) return dbError(error);
    return ok({ status: "in_progress", pct: p });
  } catch (e) { return dbError(e); }
}
