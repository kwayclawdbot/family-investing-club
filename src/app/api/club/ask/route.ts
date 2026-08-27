import { awardXp, bad, dbError, ok, readJson, requireClub, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const { question, symbol } = await readJson<{ question?: string; symbol?: string }>(req);
  const q = (question ?? "").trim();
  if (q.length < 5 || q.length > 500) return bad("Ask a real question (5–500 characters)");
  const sym = symbol ? symbol.toUpperCase().trim() : null;
  if (sym && !/^[A-Z.]{1,8}$/.test(sym)) return bad("Invalid symbol");
  const { data, error } = await r.supa.from("fic_club_asks").insert({ club_id: r.ctx.club.id, author_id: r.session.user.id, question: q, symbol: sym }).select("id").single();
  if (error) return dbError(error);
  const xp = await awardXp(r.session.user.id, "ask", xpFor("ask")!, (data as { id: string }).id);
  return ok({ id: (data as { id: string }).id, xp });
}
