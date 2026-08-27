import { awardXp, bad, dbError, ok, priceOf, readJson, requireClub, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const b = await readJson<{ symbol?: string; companyName?: string; stance?: string; reason?: string; horizon?: string; confidence?: number; visibility?: string }>(req);
  const symbol = (b.symbol ?? "").toUpperCase().trim();
  if (!/^[A-Z.]{1,8}$/.test(symbol)) return bad("Pick a company first");
  if (!["buy", "watch", "pass"].includes(b.stance ?? "")) return bad("Choose Buy, Watch or Pass");
  const reason = (b.reason ?? "").trim();
  if (reason.length < 3 || reason.length > 280) return bad("Give one honest sentence (3–280 characters)");
  if (!["1y", "3y", "5y+"].includes(b.horizon ?? "")) return bad("Choose a time horizon");
  const confidence = Math.round(Number(b.confidence));
  if (!(confidence >= 1 && confidence <= 5)) return bad("Confidence is 1–5");
  const visibility = b.visibility === "public" ? "public" : "club";
  const { data, error } = await r.supa.from("fic_club_picks").insert({
    club_id: r.ctx.club.id, author_id: r.session.user.id, symbol, company_name: b.companyName ?? null, stance: b.stance, reason,
    horizon: b.horizon, confidence, visibility, price_at_pick: await priceOf(symbol),
  }).select("id").single();
  if (error) return dbError(error);
  const xp = await awardXp(r.session.user.id, "pick", xpFor("pick")!, (data as { id: string }).id);
  return ok({ id: (data as { id: string }).id, xp });
}
