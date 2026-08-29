import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/notes { userId, note } — FTA `admin_notes` (admin-only RLS, written as the admin). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ userId?: string; note?: string }>(req);
  const note = (b.note ?? "").trim();
  if (!b.userId || !note) return bad("userId and note are required");
  const { data, error } = await r.supa.from("admin_notes").insert({ user_id: b.userId, author_id: r.session.user.id, note: note.slice(0, 4000) }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: data.id });
}

/** DELETE /api/admin/notes { id } */
export async function DELETE(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id) return bad("id required");
  const { error } = await r.supa.from("admin_notes").delete().eq("id", id);
  if (error) return dbError(error);
  return ok();
}
