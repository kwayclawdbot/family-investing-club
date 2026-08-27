import "server-only";
import type { ClubConsensus, FicConsensus, PickStance } from "@/lib/types";
import { adminClient, must, safe } from "./supa";

/**
 * Cross-club aggregates. Service role only — never returns per-user rows to callers,
 * only counts and the current user's own club's summary.
 */
type PickRow = { author_id: string; stance: PickStance; verified_owner: boolean; reason: string; club_id: string | null };

export async function ficConsensus(symbol: string): Promise<FicConsensus | null> {
  return safe("admin.ficConsensus", async () => {
    const supa = adminClient();
    if (!supa) return null;
    const rows = must(await supa.from("fic_club_picks").select("stance, verified_owner").eq("symbol", symbol.toUpperCase())) as { stance: PickStance; verified_owner: boolean }[];
    if (!rows.length) return null;
    const n = rows.length;
    const cnt = (s: PickStance) => rows.filter((r) => r.stance === s).length;
    const pct = (s: PickStance) => Math.round((cnt(s) / n) * 100);
    return { symbol: symbol.toUpperCase(), picks: n, buyPct: pct("buy"), watchPct: pct("watch"), passPct: pct("pass"), verifiedOwners: rows.filter((r) => r.verified_owner).length };
  });
}

/** Club consensus for one symbol, limited to `clubId` (the caller must already be a member). */
export async function clubConsensus(clubId: string, symbol: string, modelTargetPct: number | null): Promise<ClubConsensus | null> {
  return safe("admin.clubConsensus", async () => {
    const supa = adminClient();
    if (!supa) return null;
    const rows = must(await supa.from("fic_club_picks").select("author_id, stance, verified_owner, reason, club_id").eq("club_id", clubId).eq("symbol", symbol.toUpperCase())) as PickRow[];
    if (!rows.length) return null;
    const buy = rows.filter((r) => r.stance === "buy").length;
    const watch = rows.filter((r) => r.stance === "watch").length;
    const pass = rows.filter((r) => r.stance === "pass").length;
    const n = rows.length;
    const confidencePct = Math.round(((buy + watch * 0.5) / n) * 100);
    const reasons = rows.map((r) => r.reason).filter(Boolean);
    return {
      symbol: symbol.toUpperCase(), confidencePct, buy, watch, pass,
      verifiedOwners: rows.filter((r) => r.verified_owner).length,
      modelTargetPct, verifiedExposurePct: null,
      thesis: reasons[0] ? reasons[0].split(/[.!?]/)[0].slice(0, 60) : "",
      why: reasons.length ? `The club's reasons: ${reasons.slice(0, 3).map((r) => `"${r}"`).join(" · ")}` : "",
      voters: [...new Set(rows.map((r) => r.author_id))], totalPicks: n,
    };
  });
}
