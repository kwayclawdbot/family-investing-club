import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

type Row = { email: string; first_name?: string; last_name?: string; phone?: string; tags?: string[] };

/** POST /api/admin/leads/import { rows: [{email, first_name?, last_name?, phone?, tags?}], source? } — FTA `admin_marketing_import`. */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ rows?: Row[]; source?: string }>(req);
  const rows = (Array.isArray(b.rows) ? b.rows : []).map((x) => ({
    email: String(x.email ?? "").trim().toLowerCase(), first_name: x.first_name?.trim() || undefined, last_name: x.last_name?.trim() || undefined, phone: x.phone?.trim() || undefined,
    tags: Array.isArray(x.tags) ? x.tags.map((t) => String(t).trim()).filter(Boolean) : undefined,
  })).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email));
  if (!rows.length) return bad("No valid rows (each needs an email)");
  if (rows.length > 5000) return bad("Import at most 5,000 rows at a time");
  const { data, error } = await r.supa.rpc("admin_marketing_import", { p_leads: rows, p_source: b.source?.trim() || "csv" });
  if (error) return dbError(error);
  return ok(data as Record<string, unknown>);
}
