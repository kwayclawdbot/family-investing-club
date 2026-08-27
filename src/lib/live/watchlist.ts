import "server-only";
import type { WatchItem } from "@/lib/types";
import { getSession } from "./session";
import { must, safe, userClient } from "./supa";

type FamilyWl = { id: string; family_id: string; ticker: string; company_name: string | null; status: string | null; champion_id: string | null; why_we_picked: string | null; wl_active: boolean | null };
type Stance = { ticker: string; stance: string; note: string | null };

/** Personal list = the member's ticker stances; family/club list = family_watchlist with the champion's "why". */
export async function getWatchlist(): Promise<(WatchItem & { addedBy?: string })[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("watchlist.getWatchlist", async () => {
    const supa = await userClient();
    const [stances, fam] = await Promise.all([
      supa.from("ticker_stances").select("ticker, stance, note").eq("user_id", s.user.id),
      s.profile?.family_id ? supa.from("family_watchlist").select("id, family_id, ticker, company_name, status, champion_id, why_we_picked, wl_active").eq("family_id", s.profile.family_id) : Promise.resolve({ data: [], error: null }),
    ]);
    const personal = ((stances.data ?? []) as Stance[]).map<WatchItem>((r) => ({ symbol: r.ticker, name: r.ticker, reason: r.note ?? `${r.stance} stance`, list: "personal" }));
    const family = (must(fam) as FamilyWl[]).filter((r) => r.wl_active !== false).map<WatchItem & { addedBy?: string }>((r) => ({ symbol: r.ticker, name: r.company_name ?? r.ticker, reason: r.why_we_picked ?? "", list: "family", addedBy: r.champion_id ?? undefined }));
    if (!personal.length && !family.length) return null;
    return [...personal, ...family];
  });
}
