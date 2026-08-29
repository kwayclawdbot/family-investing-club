import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/**
 * POST /api/onboarding/family — the caller's family (tenant) + its club, idempotent.
 * Body: { name, kind?: family|friends|mixed, privacy?: private|public, displayName? }
 * Wraps `fic_ensure_family_club`, which creates the family via FTA's `onboard_create_family` when
 * the profile has none, then the club, then syncs every family profile into `fic_club_members`.
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ name?: string; kind?: string; privacy?: string; displayName?: string }>(req);
  const name = (b.name ?? "").trim();
  if (name && (name.length < 2 || name.length > 80)) return bad("Name must be 2–80 characters");
  const kind = ["family", "friends", "mixed"].includes(b.kind ?? "") ? b.kind : "family";
  const privacy = b.privacy === "public" ? "public" : "private";

  const displayName = (b.displayName ?? "").trim();
  if (displayName) {
    const { error } = await r.supa.from("profiles").update({ display_name: displayName.slice(0, 60) }).eq("id", r.session.user.id);
    if (error) return dbError(error);
  }
  const { data, error } = await r.supa.rpc("fic_ensure_family_club", { p_name: name || null, p_kind: kind, p_privacy: privacy });
  if (error) return dbError(error);
  const c = data as { id: string; name: string; invite_code: string; family_id: string | null };
  return ok({ id: c.id, name: c.name, inviteCode: c.invite_code, familyId: c.family_id });
}
