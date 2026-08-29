import "server-only";
import { NextResponse } from "next/server";
import { dbError } from "@/lib/live/route-utils";

/**
 * Surface FTA's database-line refusals honestly. Kid walls (161/214), family guardrails (192),
 * circle walls (191) and the profanity trigger (207) all refuse at the row level — the app never
 * pretends the write happened.
 */
export function writeError(e: unknown, what = "post") {
  const err = e as { message?: string; code?: string; details?: string };
  const msg = err?.message ?? "";
  if (err?.code === "42501" || /row-level security/i.test(msg)) {
    return NextResponse.json({ error: `Your account can't ${what} here yet — a grown-up manages this setting.`, code: "refused" }, { status: 403 });
  }
  if (err?.code === "23514" || err?.code === "P0001" || err?.code === "23505") {
    // Trigger messages are written for members ("Let's keep it kind — kids are in the club too…").
    return NextResponse.json({ error: msg.replace(/^new row for relation .*? violates check constraint .*$/i, "That didn't pass the club's rules") || "That didn't pass the club's rules", code: "rule" }, { status: 422 });
  }
  return dbError(e);
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TICKER = /^[A-Z.\-]{1,10}$/;
