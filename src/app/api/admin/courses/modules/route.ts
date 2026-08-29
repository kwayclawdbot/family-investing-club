import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

type Body = { id?: string; course_id?: string; title?: string; description?: string | null; track?: string | null; sort_order?: number };
const TRACKS = new Set(["all", "kids", "teens", "adults"]);

function payload(b: Body) {
  const p: Record<string, unknown> = {};
  if (b.title !== undefined) p.title = b.title.trim();
  if (b.description !== undefined) p.description = b.description?.trim() || null;
  if (b.track !== undefined) p.track = b.track && TRACKS.has(b.track) ? b.track : null;
  if (b.sort_order !== undefined) p.sort_order = Number(b.sort_order) || 0;
  return p;
}

export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.course_id || !b.title?.trim()) return bad("course_id and title are required");
  const { data, error } = await r.supa.from("modules").insert({ course_id: b.course_id, sort_order: 0, ...payload(b) }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: data.id });
}

export async function PATCH(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.id) return bad("id required");
  const p = payload(b);
  if (!Object.keys(p).length) return bad("Nothing to change");
  const { error } = await r.supa.from("modules").update(p).eq("id", b.id);
  if (error) return dbError(error);
  return ok({ id: b.id });
}

/** DELETE — refuses while lessons remain (retire lessons instead; member progress references them). */
export async function DELETE(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id) return bad("id required");
  const { count } = await r.supa.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", id);
  if (count) return bad(`This module still has ${count} lesson${count === 1 ? "" : "s"} — move or retire them first`, 409);
  const { error } = await r.supa.from("modules").delete().eq("id", id);
  if (error) return dbError(error);
  return ok();
}
