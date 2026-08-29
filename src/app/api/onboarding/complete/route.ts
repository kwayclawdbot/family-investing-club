import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

const LEVELS = ["Explorer", "Builder", "Investor", "Trader"] as const;

/**
 * POST /api/onboarding/complete — persist the wizard answers on `profiles` and stamp
 * `onboarding_complete`. Solo members ("just me") get their family/club here too so every
 * signed-in member has a tenant. The profile-guard trigger allows these columns (not role/family).
 * Body: { level?, goals?: string[], daily?: number|null, reminder?: boolean, weeklyHabit?: boolean, start?, who? }
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ level?: string; goals?: string[]; daily?: number | null; reminder?: boolean; weeklyHabit?: boolean; start?: string; who?: string }>(req);
  if (b.level && !LEVELS.includes(b.level as (typeof LEVELS)[number])) return bad("Unknown level");

  const { data: cur } = await r.supa.from("profiles").select("notification_prefs, family_id").eq("id", r.session.user.id).maybeSingle();
  const prefs = { ...((cur?.notification_prefs as Record<string, unknown> | null) ?? {}) };
  if (b.daily !== undefined) prefs.daily_goal_min = b.daily;
  if (b.reminder !== undefined) prefs.daily_reminder = !!b.reminder;
  if (b.weeklyHabit !== undefined) prefs.weekly_club_prompt = !!b.weeklyHabit;
  if (Array.isArray(b.goals)) prefs.goals = b.goals.filter((g) => typeof g === "string").slice(0, 8);
  if (b.start) prefs.starting_point = String(b.start).slice(0, 20);

  const patch: Record<string, unknown> = { onboarding_complete: true, notification_prefs: prefs };
  if (b.level) patch.comprehension_level = b.level.toLowerCase();
  const { error } = await r.supa.from("profiles").update(patch).eq("id", r.session.user.id);
  if (error) return dbError(error);

  // Every member needs a tenant; a solo member gets a one-person family (and its club) now.
  let inviteCode: string | null = null;
  if (!cur?.family_id) {
    const { data, error: e2 } = await r.supa.rpc("fic_ensure_family_club", { p_name: null, p_kind: "family", p_privacy: "private" });
    if (e2) return dbError(e2);
    inviteCode = (data as { invite_code: string } | null)?.invite_code ?? null;
  }
  return ok({ inviteCode });
}
