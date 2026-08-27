import "server-only";
import { cache } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { ExplanationLevel } from "@/lib/types";
import { userClient } from "./supa";

export type ProfileRow = {
  id: string; family_id: string | null; role: string | null; display_name: string | null; email: string | null;
  age_group: string | null; comprehension_level: string | null; onboarding_complete: boolean | null; username: string | null;
};
export type Session = { user: AuthUser; profile: ProfileRow | null };

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

/** Cookie session + profile, memoised per request. Null when signed out or Supabase is unreachable. */
export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const supa = await userClient();
    const { data: { user }, error } = await supa.auth.getUser();
    if (error || !user) return null;
    const { data: profile } = await supa
      .from("profiles")
      .select("id, family_id, role, display_name, email, age_group, comprehension_level, onboarding_complete, username")
      .eq("id", user.id)
      .maybeSingle();
    return { user, profile: (profile as ProfileRow | null) ?? null };
  } catch {
    return null;
  }
});
