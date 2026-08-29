import "server-only";
import { cache } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { ExplanationLevel } from "@/lib/types";
import { userClient } from "./supa";

export type ProfileRow = {
  id: string; family_id: string | null; role: string | null; display_name: string | null; email: string | null;
  age_group: string | null; comprehension_level: string | null; onboarding_complete: boolean | null; username: string | null;
  avatar_url?: string | null;
};
/** The tenant. `door` is FTA's experience axis (club | family); `tier` comes from the family_tiers view. */
export type FamilyRow = { id: string; name: string | null; plan_tier: string | null; door: string | null; stripe_customer_id: string | null; expires_at: string | null };
export type Tier = "fta" | "fic" | "free";
export type Session = { user: AuthUser; profile: ProfileRow | null; family: FamilyRow | null; tier: Tier | null; clubLapsed: boolean };

/** Level from profile: comprehension_level wins, else age_group. */
export function levelOf(p: Pick<ProfileRow, "comprehension_level" | "age_group"> | null | undefined): ExplanationLevel {
  const c = (p?.comprehension_level ?? "").toLowerCase();
  if (c.startsWith("explor")) return "Explorer";
  if (c.startsWith("build")) return "Builder";
  if (c.startsWith("trad") || c.startsWith("adv")) return "Trader";
  if (c.startsWith("invest")) return "Investor";
  const a = (p?.age_group ?? "").toLowerCase();
  if (a.includes("kid") || a.includes("child") || a === "8-12") return "Explorer";
  if (a.includes("teen")) return "Builder";
  return "Investor";
}

/** Child shell + kid-safe gates: a `child` role or a minor age band (FTA's viewer_is_kid()). */
export function isChild(s: Session | null | undefined): boolean {
  const p = s?.profile;
  if (!p) return false;
  const a = (p.age_group ?? "").toLowerCase();
  return p.role === "child" || a === "kids" || a === "teens";
}
export function isAdmin(s: Session | null | undefined): boolean { return s?.profile?.role === "admin"; }
export function isParent(s: Session | null | undefined): boolean { return s?.profile?.role === "parent" || s?.profile?.role === "admin"; }
/** Parents (and admins) who haven't finished the wizard are routed back into it by the app layout. */
export function needsOnboarding(s: Session | null | undefined): boolean {
  const p = s?.profile;
  if (!p) return false;
  return p.onboarding_complete !== true && p.role !== "child";
}

/** Cookie session + profile + family + tier, memoised per request. Null when signed out or Supabase is unreachable. */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const supa = await userClient();
    const { data: { user }, error } = await supa.auth.getUser();
    if (error || !user) return null;
    const { data: profile } = await supa
      .from("profiles")
      .select("id, family_id, role, display_name, email, age_group, comprehension_level, onboarding_complete, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    const p = (profile as ProfileRow | null) ?? null;
    let family: FamilyRow | null = null, tier: Tier | null = null, clubLapsed = false;
    if (p?.family_id) {
      const [f, t] = await Promise.all([
        supa.from("families").select("id, name, plan_tier, door, stripe_customer_id, expires_at").eq("id", p.family_id).maybeSingle(),
        supa.from("family_tiers").select("tier, club_lapsed").eq("family_id", p.family_id).maybeSingle(),
      ]);
      family = (f.data as FamilyRow | null) ?? null;
      const tr = t.data as { tier: Tier; club_lapsed: boolean } | null;
      tier = tr?.tier ?? null;
      clubLapsed = tr?.club_lapsed ?? false;
    }
    return { user, profile: p, family, tier, clubLapsed };
  } catch {
    return null;
  }
});
