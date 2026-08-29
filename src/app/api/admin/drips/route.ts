import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/drips { enabled } — flips `app_settings.drip_enabled` (the welcome-drip cron reads it). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ enabled?: boolean }>(req);
  if (typeof b.enabled !== "boolean") return bad("enabled must be boolean");
  const { error } = await r.supa.from("app_settings").upsert({ key: "drip_enabled", value: b.enabled, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return dbError(error);
  return ok({ enabled: b.enabled });
}
