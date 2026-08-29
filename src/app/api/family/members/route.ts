import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/**
 * Household members (parents only). FTA's `guard_profile_privileged_columns` trigger is the
 * authority: a parent may change a household member's display name and the minor register
 * (age_group kids|teens), and may only ever CLEAR family_id (remove from the household).
 *
 *   PATCH  /api/family/members { id, displayName?, ageGroup?: 'kids'|'teens' }
 *   DELETE /api/family/members { id }   — remove from the household (never yourself)
 */
async function parent() {
  const r = await requireSession(); if (r.error) return r;
  const p = r.session.profile;
  if (!p?.family_id) return { error: bad("Create your family first", 409) } as const;
  if (p.role !== "parent" && p.role !== "admin") return { error: bad("Only a parent can manage the household", 403) } as const;
  return r;
}

export async function PATCH(req: Request) {
  const r = await parent(); if (r.error) return r.error;
  const fam = r.session.profile!.family_id!;
  const b = await readJson<{ id?: string; displayName?: string; ageGroup?: string }>(req);
  if (!b.id) return bad("Which member?");
  const patch: Record<string, unknown> = {};
  if (typeof b.displayName === "string") {
    const n = b.displayName.trim();
    if (n.length < 1 || n.length > 60) return bad("Name must be 1–60 characters");
    patch.display_name = n;
  }
  if (b.ageGroup !== undefined) {
    if (b.ageGroup !== "kids" && b.ageGroup !== "teens") return bad("Age band must be kids or teens");
    patch.age_group = b.ageGroup;
  }
  if (!Object.keys(patch).length) return bad("Nothing to change");
  const { data: target } = await r.supa.from("profiles").select("id, family_id, role").eq("id", b.id).maybeSingle();
  if (!target || target.family_id !== fam) return bad("That member isn't in your household", 404);
  if (patch.age_group && target.role !== "child") return bad("Only a child's age band can be changed here");
  const { error } = await r.supa.from("profiles").update(patch).eq("id", b.id);
  if (error) return dbError(error);
  return ok();
}

export async function DELETE(req: Request) {
  const r = await parent(); if (r.error) return r.error;
  const fam = r.session.profile!.family_id!;
  const b = await readJson<{ id?: string }>(req);
  if (!b.id) return bad("Which member?");
  if (b.id === r.session.user.id) return bad("You can't remove yourself — ask another parent, or contact support");
  const { data: target } = await r.supa.from("profiles").select("id, family_id").eq("id", b.id).maybeSingle();
  if (!target || target.family_id !== fam) return bad("That member isn't in your household", 404);
  const { error } = await r.supa.from("profiles").update({ family_id: null }).eq("id", b.id);
  if (error) return dbError(error);
  return ok();
}
