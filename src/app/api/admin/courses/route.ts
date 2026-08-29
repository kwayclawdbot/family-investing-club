import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

type Body = { id?: string; title?: string; slug?: string; description?: string | null; thumbnail_url?: string | null; min_tier?: string | null; program?: string | null; sort_order?: number; published?: boolean };

function payload(b: Body) {
  const p: Record<string, unknown> = {};
  if (b.title !== undefined) p.title = b.title.trim();
  if (b.slug !== undefined) p.slug = b.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (b.description !== undefined) p.description = b.description?.trim() || null;
  if (b.thumbnail_url !== undefined) p.thumbnail_url = b.thumbnail_url?.trim() || null;
  if (b.min_tier !== undefined) p.min_tier = b.min_tier || null;
  if (b.program !== undefined) p.program = b.program || null;
  if (b.sort_order !== undefined) p.sort_order = Number(b.sort_order) || 0;
  if (b.published !== undefined) p.published = !!b.published;
  return p;
}

/** POST /api/admin/courses — create (admin RLS on `courses`). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.title?.trim() || !b.slug?.trim()) return bad("Title and slug are required");
  const { data, error } = await r.supa.from("courses").insert({ published: false, sort_order: 0, ...payload(b) }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: data.id });
}

/** PATCH /api/admin/courses { id, ...fields } — also the publish toggle. */
export async function PATCH(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.id) return bad("id required");
  const p = payload(b);
  if (!Object.keys(p).length) return bad("Nothing to change");
  const { error } = await r.supa.from("courses").update({ ...p, updated_at: new Date().toISOString() }).eq("id", b.id);
  if (error) return dbError(error);
  return ok({ id: b.id });
}

/** DELETE /api/admin/courses { id } — refuses while the course still has modules (delete those first; progress rows hang off lessons). */
export async function DELETE(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id) return bad("id required");
  const { count } = await r.supa.from("modules").select("id", { count: "exact", head: true }).eq("course_id", id);
  if (count) return bad(`This course still has ${count} module${count === 1 ? "" : "s"} — remove them first`, 409);
  const { error } = await r.supa.from("courses").delete().eq("id", id);
  if (error) return dbError(error);
  return ok();
}
