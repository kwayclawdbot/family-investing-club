import { requireAdmin } from "@/lib/live/admin-crm";
import { dbError, ok } from "@/lib/live/route-utils";

/** POST /api/admin/leads/sync — FTA `admin_marketing_sync_conversions` (leads whose email now has a profile → converted). */
export async function POST() {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { data, error } = await r.supa.rpc("admin_marketing_sync_conversions");
  if (error) return dbError(error);
  return ok(data as Record<string, unknown>);
}
