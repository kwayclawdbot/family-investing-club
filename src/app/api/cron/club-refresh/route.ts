import { NextRequest, NextResponse } from "next/server";
import { requireCron } from "@/lib/server/cron-guard";
import { createAdminClient } from "@/lib/server/db";

/**
 * POST/GET /api/club/refresh — recompute the ClubHome cached aggregates.
 *
 * Driven by Vercel Cron (see vercel.json) the same way every other periodic job
 * in this app runs (pg_cron is not enabled). Secret-guarded exactly like the
 * other crons: Bearer CRON_SECRET or ?secret=. Delegates to the SECURITY DEFINER
 * refresh_club_metrics() which holds an advisory lock (safe to call often).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const denied = requireCron(req);
  if (denied) return denied;

  const db = createAdminClient();
  const { data, error } = await db.rpc("refresh_club_metrics");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result: data });
}

export const GET = handle;
export const POST = handle;
