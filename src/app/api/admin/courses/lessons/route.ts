import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

type Body = { id?: string; module_id?: string; title?: string; description?: string | null; video_provider?: string | null; video_id?: string | null; video_duration_sec?: number | null; drip_week?: number | null; has_quiz?: boolean; is_free?: boolean; sort_order?: number; est_minutes?: number | null; lesson_xp?: number | null; retired?: boolean };
const PROVIDERS = new Set(["youtube", "html", "bunny", "mux"]);

function payload(b: Body) {
  const p: Record<string, unknown> = {};
  if (b.module_id !== undefined) p.module_id = b.module_id;
  if (b.title !== undefined) p.title = b.title.trim();
  if (b.description !== undefined) p.description = b.description?.trim() || null;
  if (b.video_provider !== undefined) p.video_provider = b.video_provider && PROVIDERS.has(b.video_provider) ? b.video_provider : null;
  if (b.video_id !== undefined) p.video_id = b.video_id?.trim() || null;
  if (b.video_duration_sec !== undefined) p.video_duration_sec = b.video_duration_sec ? Number(b.video_duration_sec) : null;
  if (b.drip_week !== undefined) p.drip_week = b.drip_week ? Number(b.drip_week) : null;
  if (b.has_quiz !== undefined) p.has_quiz = !!b.has_quiz;
  if (b.is_free !== undefined) p.is_free = !!b.is_free;
  if (b.sort_order !== undefined) p.sort_order = Number(b.sort_order) || 0;
  if (b.est_minutes !== undefined) p.est_minutes = b.est_minutes ? Number(b.est_minutes) : null;
  if (b.lesson_xp !== undefined) p.lesson_xp = b.lesson_xp ? Number(b.lesson_xp) : null;
  if (b.retired !== undefined) p.retired = !!b.retired;
  return p;
}

export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.module_id || !b.title?.trim()) return bad("module_id and title are required");
  const { data, error } = await r.supa.from("lessons").insert({ sort_order: 0, has_quiz: false, is_free: false, retired: false, ...payload(b) }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: data.id });
}

/** PATCH — edits metadata only; `steps` / `steps_draft` are the Learn lane's editor, published via /courses/publish. */
export async function PATCH(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.id) return bad("id required");
  const p = payload(b);
  if (!Object.keys(p).length) return bad("Nothing to change");
  const { error } = await r.supa.from("lessons").update(p).eq("id", b.id);
  if (error) return dbError(error);
  return ok({ id: b.id });
}

/** DELETE — hard delete only when nobody has progress on it; otherwise retire it. */
export async function DELETE(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id) return bad("id required");
  const db = r.admin ?? r.supa;
  const { count } = await db.from("lesson_progress").select("id", { count: "exact", head: true }).eq("lesson_id", id);
  if (count) {
    const { error } = await r.supa.from("lessons").update({ retired: true }).eq("id", id);
    if (error) return dbError(error);
    return ok({ retired: true, progressRows: count });
  }
  await r.supa.from("lesson_resources").delete().eq("lesson_id", id);
  await r.supa.from("quizzes").delete().eq("lesson_id", id);
  const { error } = await r.supa.from("lessons").delete().eq("id", id);
  if (error) return dbError(error);
  return ok({ retired: false });
}
