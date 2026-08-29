import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

const ROLES = new Set(["parent", "child", "coach", "admin"]);
const AGE = new Set(["kids", "teens", "adults"]);

/** PATCH /api/admin/members { userId, role?, ageGroup?, displayName? } — `profiles` under FTA's "Admins update any profile" policy. */
export async function PATCH(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ userId?: string; role?: string; ageGroup?: string | null; displayName?: string }>(req);
  if (!b.userId) return bad("userId required");
  const patch: Record<string, unknown> = {};
  if (b.role !== undefined) { if (!ROLES.has(b.role)) return bad("Unknown role"); patch.role = b.role; }
  if (b.ageGroup !== undefined) { if (b.ageGroup !== null && !AGE.has(b.ageGroup)) return bad("Unknown age group"); patch.age_group = b.ageGroup; }
  if (b.displayName !== undefined) patch.display_name = b.displayName.trim().slice(0, 80) || null;
  if (!Object.keys(patch).length) return bad("Nothing to change");
  if (b.userId === r.session.user.id && patch.role && patch.role !== "admin") return bad("You can't remove your own admin role", 409);
  const { error } = await r.supa.from("profiles").update(patch).eq("id", b.userId);
  if (error) return dbError(error);
  return ok();
}
