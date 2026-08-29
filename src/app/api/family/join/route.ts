import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/**
 * POST /api/family/join — redeem a household invite (FTA `redeem_invite`), then land the member in
 * the family's club. Body: { code, displayName? }. Also accepts a CLUB invite code (fic_join_club)
 * so one `/join/[code]` surface serves both.
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ code?: string; displayName?: string }>(req);
  const code = (b.code ?? "").trim().toUpperCase();
  if (code.length < 4 || code.length > 24) return bad("Enter the invite code");
  const displayName = (b.displayName ?? "").trim() || null;

  const fam = await r.supa.rpc("redeem_invite", { p_code: code, p_display_name: displayName });
  if (fam.error) return dbError(fam.error);
  const res = fam.data as { ok: boolean; reason?: string; family_id?: string; role?: string; age_group?: string | null };
  if (res.ok) {
    const club = await r.supa.rpc("fic_ensure_family_club", { p_name: null, p_kind: "family", p_privacy: "private" });
    if (club.error) return dbError(club.error);
    const c = club.data as { id: string; name: string; invite_code: string };
    return ok({ kind: "family", familyId: res.family_id, role: res.role, ageGroup: res.age_group, club: { id: c.id, name: c.name } });
  }
  if (res.reason !== "invalid") return bad(res.reason === "expired" ? "That invite has expired" : res.reason === "used" ? "That invite was already used" : "Sign in first", 409);

  // Not a household invite — try a club code (friends/mixed clubs, or a family club shared by link).
  const joined = await r.supa.rpc("fic_join_club", { p_code: code });
  if (joined.error) return bad("That code didn't match an invite", 404);
  const c = joined.data as { id: string; name: string };
  return ok({ kind: "club", club: { id: c.id, name: c.name } });
}
