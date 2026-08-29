import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { awardXp } from "@/lib/live/route-utils";

/** FTA `hasXpForRef`: XP for (kind, ref) is granted once. */
export async function hasXpForRef(supa: SupabaseClient, userId: string, kind: string, refId: string): Promise<boolean> {
  const { count } = await supa.from("xp_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("kind", kind).eq("ref_id", refId);
  return (count ?? 0) > 0;
}

export async function lifetimeXp(supa: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supa.from("xp_events").select("amount").eq("user_id", userId);
  return ((data ?? []) as { amount: number }[]).reduce((a, r) => a + (r.amount ?? 0), 0);
}

/** Award once per (kind, ref). Returns the amount actually granted (0 when already banked or capped away). */
export async function awardOnce(supa: SupabaseClient, userId: string, kind: string, amount: number, refId: string): Promise<number> {
  if (await hasXpForRef(supa, userId, kind, refId)) return 0;
  return awardXp(userId, kind, amount, refId);
}

export const isRlsDenied = (e: unknown) => (e as { code?: string } | null)?.code === "42501";
export const GUARDRAIL_MESSAGE = "Practice trading is paused right now by your family's screen-time guardrails. Try again after downtime ends.";
