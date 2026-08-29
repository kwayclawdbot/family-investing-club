import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/server/cron-guard";
import { createAdminClient } from "@/lib/server/db";
import { computeUserInsights } from "@/lib/server/insights/compute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/insights — recompute the "HOW THEY INVEST" digest for every
 * member who has any behaviour to summarise (a stance, a sentiment vote, or a
 * watchlist they champion). Members with no behaviour are skipped — an empty
 * insight row would just render an empty state the profile already handles.
 *
 * Auth: Bearer CRON_SECRET or ?secret=. Refuses if CRON_SECRET unset.
 *   ?dry=1 — list the members that would be recomputed, compute nothing.
 */
export async function GET(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;
  const sp = req.nextUrl.searchParams;
  const dry = sp.get("dry") === "1";

  const admin = createAdminClient();

  // Every user_id that appears in any behaviour source.
  const [stances, votes, watches] = await Promise.all([
    admin.from("ticker_stances").select("user_id"),
    admin.from("ticker_sentiment").select("user_id"),
    admin.from("family_watchlist").select("champion_id"),
  ]);

  const ids = new Set<string>();
  for (const r of (stances.data ?? []) as { user_id: string }[]) if (r.user_id) ids.add(r.user_id);
  for (const r of (votes.data ?? []) as { user_id: string }[]) if (r.user_id) ids.add(r.user_id);
  for (const r of (watches.data ?? []) as { champion_id: string | null }[])
    if (r.champion_id) ids.add(r.champion_id);

  const members = [...ids];
  if (dry) {
    return NextResponse.json({ dry: true, count: members.length, members });
  }

  let ok = 0;
  const failed: { id: string; error: string }[] = [];
  for (const id of members) {
    try {
      await computeUserInsights(id);
      ok++;
    } catch (e) {
      failed.push({ id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ recomputed: ok, total: members.length, failed });
}
