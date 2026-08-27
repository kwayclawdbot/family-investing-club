import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession, type Session } from "./session";
import { adminClient, userClient } from "./supa";
import { clubContext, type ClubContext } from "./club";

type Fail = { error: NextResponse; session?: undefined; supa?: undefined; ctx?: undefined };
type SessOk = { error?: undefined; session: Session; supa: SupabaseClient };
type ClubOk = SessOk & { ctx: ClubContext };

export async function requireSession(): Promise<Fail | SessOk> {
  const s = await getSession();
  if (!s) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  return { session: s, supa: await userClient() };
}

export async function requireClub(): Promise<Fail | ClubOk> {
  const base = await requireSession();
  if (base.error) return base;
  const ctx = await clubContext();
  if (!ctx) return { error: NextResponse.json({ error: "You're not in a club yet" }, { status: 409 }) };
  return { ...base, ctx };
}

export async function readJson<T extends Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}

export function bad(msg: string, status = 400) { return NextResponse.json({ error: msg }, { status }); }
export function ok(body: Record<string, unknown> = {}) { return NextResponse.json({ ok: true, ...body }); }

export function dbError(e: unknown) {
  const err = e as { message?: string; code?: string };
  const missing = err?.code === "42P01" || err?.code === "PGRST205" || err?.code === "PGRST202" || (err?.message ?? "").includes("does not exist");
  return NextResponse.json({ error: missing ? "Club tables aren't migrated yet" : err?.message ?? "Database error" }, { status: missing ? 503 : 500 });
}

const XP_KINDS: Record<string, number> = { pick: 8, ask: 5, vote: 6, proposal: 12, research: 15, reply: 3, lesson: 20, flashcard: 5, game: 10, family_night: 10, scenario: 15, chart_drill: 8 };
export const XP_MAX = 40;
export function xpFor(kind: string) { return XP_KINDS[kind] ?? null; }

/** Award XP as the user (RLS) — falls back to admin if xp_events isn't writable by users. Never throws. */
export async function awardXp(userId: string, kind: string, amount: number, refId?: string): Promise<number> {
  const amt = Math.min(XP_MAX, Math.max(0, Math.round(amount)));
  if (!amt) return 0;
  try {
    const supa = await userClient();
    const { error } = await supa.from("xp_events").insert({ user_id: userId, amount: amt, kind, ref_id: refId ?? null });
    if (!error) return amt;
    const admin = adminClient();
    if (!admin) return 0;
    const { error: e2 } = await admin.from("xp_events").insert({ user_id: userId, amount: amt, kind, ref_id: refId ?? null });
    return e2 ? 0 : amt;
  } catch { return 0; }
}

export async function priceOf(symbol: string): Promise<number | null> {
  try { const { quoteSafe } = await import("./market-bridge"); return (await quoteSafe(symbol))?.price ?? null; } catch { return null; }
}
