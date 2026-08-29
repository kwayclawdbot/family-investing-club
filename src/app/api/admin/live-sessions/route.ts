import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

type Body = { id?: string; title?: string; description?: string | null; scheduled_at?: string | null; duration_min?: number | null; zoom_join_url?: string | null; recording_url?: string | null; status?: string; track?: string | null; min_tier?: string | null; class_type?: string | null; worksheet_url?: string | null; assignment?: string | null; host_name?: string | null };
const STATUS = new Set(["scheduled", "live", "completed", "cancelled"]);
const TRACK = new Set(["all", "kids", "teens", "adults"]);
const CLASS = new Set(["free_class", "weekly_class", "guest_speaker", "orientation", "parent_qa", "kids_money_lab", "market_recap"]);

function kindOf(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("zoom.us")) return "zoom";
  return "url";
}
function payload(b: Body) {
  const p: Record<string, unknown> = {};
  if (b.title !== undefined) p.title = b.title.trim();
  if (b.description !== undefined) p.description = b.description?.trim() || null;
  if (b.scheduled_at !== undefined) p.scheduled_at = b.scheduled_at ? new Date(b.scheduled_at).toISOString() : null;
  if (b.duration_min !== undefined) p.duration_min = b.duration_min ? Number(b.duration_min) : null;
  if (b.zoom_join_url !== undefined) p.zoom_join_url = b.zoom_join_url?.trim() || null;
  if (b.recording_url !== undefined) { const u = b.recording_url?.trim() || null; p.recording_url = u; if (u) p.recording_kind = kindOf(u); }
  if (b.status !== undefined) { if (!STATUS.has(b.status)) throw new Error("Unknown status"); p.status = b.status; }
  if (b.track !== undefined) p.track = b.track && TRACK.has(b.track) ? b.track : "all";
  if (b.min_tier !== undefined) p.min_tier = b.min_tier || null;
  if (b.class_type !== undefined) p.class_type = b.class_type && CLASS.has(b.class_type) ? b.class_type : null;
  if (b.worksheet_url !== undefined) p.worksheet_url = b.worksheet_url?.trim() || null;
  if (b.assignment !== undefined) p.assignment = b.assignment?.trim() || null;
  if (b.host_name !== undefined) p.host_name = b.host_name?.trim() || null;
  return p;
}

export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.title?.trim()) return bad("Title is required");
  let p: Record<string, unknown>;
  try { p = payload(b); } catch (e) { return bad((e as Error).message); }
  const { data, error } = await r.supa.from("live_sessions").insert({ status: "scheduled", track: "all", ...p }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: data.id });
}

export async function PATCH(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<Body>(req);
  if (!b.id) return bad("id required");
  let p: Record<string, unknown>;
  try { p = payload(b); } catch (e) { return bad((e as Error).message); }
  if (!Object.keys(p).length) return bad("Nothing to change");
  const { error } = await r.supa.from("live_sessions").update(p).eq("id", b.id);
  if (error) return dbError(error);
  return ok({ id: b.id });
}

/** DELETE — removes the row (RSVPs cascade per FTA schema). Uploaded recordings in `class-recordings` are left in place. */
export async function DELETE(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id) return bad("id required");
  const { error } = await r.supa.from("live_sessions").delete().eq("id", id);
  if (error) return dbError(error);
  return ok();
}
