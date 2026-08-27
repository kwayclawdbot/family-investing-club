import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { pickId, kind } = await readJson<{ pickId?: string; kind?: string }>(req);
  if (!pickId || !["agree", "not_sure"].includes(kind ?? "")) return bad("Invalid reaction");
  const { error } = await r.supa.from("fic_club_pick_reactions").upsert({ pick_id: pickId, user_id: r.session.user.id, kind }, { onConflict: "pick_id,user_id" });
  if (error) return dbError(error);
  return ok();
}
