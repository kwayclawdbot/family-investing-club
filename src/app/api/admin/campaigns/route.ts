import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/** POST /api/admin/campaigns { name, channel, body, subject?, segment? } — FTA `admin_marketing_create_campaign` (draft). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ name?: string; channel?: string; body?: string; subject?: string; segment?: { stages?: string[]; tags?: string[] } }>(req);
  const name = (b.name ?? "").trim(), body = (b.body ?? "").trim();
  if (!name || !body) return bad("Name and body are required");
  if (b.channel !== "email" && b.channel !== "sms") return bad("channel must be email or sms");
  if (b.channel === "email" && !(b.subject ?? "").trim()) return bad("Email campaigns need a subject");
  const segment = { stages: Array.isArray(b.segment?.stages) ? b.segment!.stages : [], tags: Array.isArray(b.segment?.tags) ? b.segment!.tags : [] };
  const { data, error } = await r.supa.rpc("admin_marketing_create_campaign", { p_name: name, p_channel: b.channel, p_body: body, p_subject: b.subject?.trim() || null, p_segment: segment });
  if (error) return dbError(error);
  return ok(data as Record<string, unknown>);
}
