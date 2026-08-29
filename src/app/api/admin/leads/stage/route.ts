import { requireAdmin, STAGES } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/leads/stage { leadId, stage } — FTA `admin_marketing_set_stage` (logs a stage_changed event). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ leadId?: string; stage?: string }>(req);
  if (!b.leadId) return bad("leadId required");
  if (!b.stage || !(STAGES as readonly string[]).includes(b.stage)) return bad("Unknown stage");
  const { error } = await r.supa.rpc("admin_marketing_set_stage", { p_lead_id: b.leadId, p_stage: b.stage });
  if (error) return dbError(error);
  return ok({ stage: b.stage });
}
