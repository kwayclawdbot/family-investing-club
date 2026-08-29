import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cronAuthorized } from "./cron-auth";
import { logNotConfigured } from "./env";

/** Returns a 401 response to send, or null when the caller is a legitimate cron. */
export function requireCron(req: NextRequest): NextResponse | null {
  const r = cronAuthorized(
    { authorization: req.headers.get("authorization"), secretParam: req.nextUrl.searchParams.get("secret") },
    process.env.CRON_SECRET
  );
  if (r.ok) return null;
  if (r.error === "CRON_SECRET not configured") logNotConfigured("CRON_SECRET");
  return NextResponse.json({ error: r.error }, { status: r.status });
}
