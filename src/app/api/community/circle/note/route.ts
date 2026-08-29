import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { UUID, writeError } from "../../_lib/errors";

/** Post into a circle → FTA `club_circle_notes` (must be a member, circle open, not a kid — RLS 191). */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { circleId, body, stance } = await readJson<{ circleId?: string; body?: string; stance?: string }>(req);
  const text = (body ?? "").trim();
  if (!circleId || !UUID.test(circleId)) return bad("Missing circle");
  if (text.length < 1 || text.length > 2000) return bad("Write a note (up to 2000 characters)");
  const st = ["bear", "neutral", "bull"].includes(stance ?? "") ? stance : null;
  const { data, error } = await r.supa.from("club_circle_notes").insert({ circle_id: circleId, author_id: r.session.user.id, body: text, stance: st }).select("id").single();
  if (error) return writeError(error, "post in this circle");
  return ok({ id: (data as { id: string }).id });
}

/** Retract your own note (RLS: own row). */
export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id || !UUID.test(id)) return bad("Missing note id");
  const { error } = await r.supa.from("club_circle_notes").delete().eq("id", id).eq("author_id", r.session.user.id);
  if (error) return writeError(error, "delete");
  return ok({ id });
}
