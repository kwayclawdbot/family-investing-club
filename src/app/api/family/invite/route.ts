import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

type InviteRow = { id: string; code: string; role: string | null; age_group: string | null; email: string | null; used_by: string | null; expires_at: string; created_at: string };

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

/** GET /api/family/invite — the household's open invites (parents only). */
export async function GET() {
  const r = await requireSession(); if (r.error) return r.error;
  const fam = r.session.profile?.family_id;
  if (!fam) return ok({ invites: [] });
  const { data, error } = await r.supa.from("family_invites").select("id, code, role, age_group, email, used_by, expires_at, created_at").eq("family_id", fam).order("created_at", { ascending: false });
  if (error) return dbError(error);
  return ok({ invites: (data as InviteRow[]).map((i) => ({ ...i, used: !!i.used_by, expired: new Date(i.expires_at) < new Date() })) });
}

/**
 * POST /api/family/invite — create a household invite (FTA `family_invites`, 7-day expiry).
 * Body: { role: 'child'|'parent', ageGroup?: 'kids'|'teens', email? }
 * The invitee signs up, then redeems at POST /api/family/join { code } → FTA `redeem_invite`.
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const p = r.session.profile;
  if (!p?.family_id) return bad("Create your family first", 409);
  if (p.role !== "parent" && p.role !== "admin") return bad("Only a parent can invite", 403);
  const b = await readJson<{ role?: string; ageGroup?: string; email?: string }>(req);
  const role = b.role === "parent" ? "parent" : "child";
  const ageGroup = role === "child" ? (b.ageGroup === "teens" ? "teens" : b.ageGroup === "kids" ? "kids" : null) : null;
  const email = (b.email ?? "").trim().toLowerCase() || null;
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeCode();
    const { data, error } = await r.supa.from("family_invites").insert({ family_id: p.family_id, code, role, age_group: ageGroup, email, expires_at: expires }).select("id, code, expires_at").single();
    if (!error) return ok({ id: data.id, code: data.code, expiresAt: data.expires_at });
    if (error.code !== "23505") return dbError(error);
  }
  return bad("Couldn't allocate an invite code, try again", 500);
}

/** DELETE /api/family/invite — revoke an open invite. Body: { id }. Parents only (RLS "Parents manage family invites"). */
export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const p = r.session.profile;
  if (!p?.family_id) return bad("Create your family first", 409);
  if (p.role !== "parent" && p.role !== "admin") return bad("Only a parent can manage invites", 403);
  const b = await readJson<{ id?: string }>(req);
  if (!b.id) return bad("Which invite?");
  const { error, count } = await r.supa.from("family_invites").delete({ count: "exact" }).eq("id", b.id).eq("family_id", p.family_id).is("used_by", null);
  if (error) return dbError(error);
  if (!count) return bad("That invite was already used or doesn't exist", 404);
  return ok();
}
