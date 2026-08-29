import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/**
 * Real-world step check (FTA `checkWatchlistHas` / `checkResearchedTicker`): the artifact must actually
 * exist — the ticker on the family watchlist, or (research) a recorded ticker stance. Never a stub.
 */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const { action, ticker } = await readJson<{ action?: "save_watchlist" | "research_ticker"; ticker?: string }>(req);
  if (!ticker || !action) return bad("action and ticker required");
  const t = ticker.toUpperCase();
  const familyId = r.session.profile?.family_id ?? null;
  try {
    if (action === "research_ticker") {
      const { count } = await r.supa.from("ticker_stances").select("ticker", { count: "exact", head: true }).eq("user_id", r.session.user.id).eq("ticker", t);
      if ((count ?? 0) > 0) return ok({ done: true, via: "stance" });
    }
    if (!familyId) return ok({ done: false });
    const { count, error } = await r.supa.from("family_watchlist").select("id", { count: "exact", head: true }).eq("family_id", familyId).eq("ticker", t);
    if (error) return dbError(error);
    return ok({ done: (count ?? 0) > 0, via: "watchlist" });
  } catch (e) { return dbError(e); }
}
