import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/leads — add one lead (FTA `admin_marketing_add_lead`). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ email?: string; first_name?: string; last_name?: string; phone?: string; tags?: string[]; source?: string; notes?: string }>(req);
  const email = (b.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Enter a valid email");
  const { data, error } = await r.supa.rpc("admin_marketing_add_lead", {
    p_email: email, p_first_name: b.first_name?.trim() || null, p_last_name: b.last_name?.trim() || null, p_phone: b.phone?.trim() || null,
    p_tags: Array.isArray(b.tags) ? b.tags.map((t) => String(t).trim()).filter(Boolean) : [], p_source: b.source?.trim() || "manual", p_notes: b.notes?.trim() || null,
  });
  if (error) return dbError(error);
  return ok(data as Record<string, unknown>);
}

/** PATCH /api/admin/leads { leadId, notes?, tags? } — FTA `admin_marketing_update_lead`. */
export async function PATCH(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ leadId?: string; notes?: string | null; tags?: string[] | null }>(req);
  if (!b.leadId) return bad("leadId required");
  const { error } = await r.supa.rpc("admin_marketing_update_lead", { p_lead_id: b.leadId, p_notes: b.notes ?? null, p_tags: b.tags ?? null });
  if (error) return dbError(error);
  return ok();
}
