import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/families/tier { familyId, tier: 'fic'|'fta' } → FTA `admin_set_family_tier` (enrollments + families.plan_tier). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ familyId?: string; tier?: string }>(req);
  if (!b.familyId) return bad("familyId required");
  if (b.tier !== "fic" && b.tier !== "fta") return bad("tier must be fic or fta");
  const { error } = await r.supa.rpc("admin_set_family_tier", { p_family_id: b.familyId, p_tier: b.tier });
  if (error) return dbError(error);
  return ok({ tier: b.tier });
}
