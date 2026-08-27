import { awardXp, bad, dbError, ok, readJson, requireSession, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { pickId, body } = await readJson<{ pickId?: string; body?: string }>(req);
  const text = (body ?? "").trim();
  if (!pickId || text.length < 1 || text.length > 1000) return bad("Write a reply (up to 1000 characters)");
  const { data, error } = await r.supa.from("fic_club_pick_replies").insert({ pick_id: pickId, author_id: r.session.user.id, body: text }).select("id").single();
  if (error) return dbError(error);
  await awardXp(r.session.user.id, "reply", xpFor("reply")!, pickId);
  return ok({ id: (data as { id: string }).id });
}
