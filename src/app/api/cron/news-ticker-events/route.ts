import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/server/cron-guard";
import { createAdminClient } from "@/lib/server/db";
import { generateTickerEvents } from "@/lib/server/news/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Ticker-events cron (LANE 10) — daily post-close. Ranks the day's notable
 * events from screener_metrics deltas (|chg|>=8% / vol_ratio>=3 / fresh 52w
 * high/low) and writes a short haiku-4.5 note for the top 6-8, each grounded
 * in the metric + any matching Polygon headline.
 *
 * Idempotent per ticker/day (slug `<ticker>-YYYY-MM-DD`): re-runs skip events
 * already written. Auth mirrors the other crons.
 */
export async function GET(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;

  const force = req.nextUrl.searchParams.get("force") === "1";
  const max = Math.min(8, Math.max(1, Number(req.nextUrl.searchParams.get("max")) || 8));

  try {
    const db = createAdminClient();
    const res = await generateTickerEvents(db, { force, max });
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json(
      { error: "ticker events failed", detail: (e as Error).message },
      { status: 500 }
    );
  }
}
