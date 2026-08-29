import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

const SETTINGS = ["chat_family_only", "downtime_enabled", "downtime_start_hour", "downtime_end_hour", "daily_limit_min", "live_listen_only", "tz"] as const;
type Setting = (typeof SETTINGS)[number];

/**
 * POST /api/family/guardrail — the ONLY write path for a child's guardrails: FTA `set_family_guardrail`
 * (verifies the caller is a parent/admin of the child's household, logs to family_guardrail_events,
 * notifies the other parents). Body: { childId, setting, value }.
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const p = r.session.profile;
  if (p?.role !== "parent" && p?.role !== "admin") return bad("Only a parent can set guardrails", 403);
  const b = await readJson<{ childId?: string; setting?: string; value?: unknown }>(req);
  if (!b.childId || !SETTINGS.includes(b.setting as Setting)) return bad("Unknown guardrail");
  const setting = b.setting as Setting;
  let value: unknown = b.value;
  if (setting === "chat_family_only" || setting === "downtime_enabled" || setting === "live_listen_only") value = !!value;
  else if (setting === "downtime_start_hour" || setting === "downtime_end_hour") { const n = Number(value); if (!Number.isInteger(n) || n < 0 || n > 23) return bad("Hour must be 0–23"); value = n; }
  else if (setting === "daily_limit_min") { if (value === null || value === "" || value === undefined) value = null; else { const n = Number(value); if (!Number.isInteger(n) || n < 5 || n > 480) return bad("Daily limit must be 5–480 minutes"); value = n; } }
  else if (setting === "tz") { if (typeof value !== "string" || value.length > 64) return bad("Bad timezone"); }

  const { data, error } = await r.supa.rpc("set_family_guardrail", { p_child: b.childId, p_setting: setting, p_value: value });
  if (error) {
    const m = error.message ?? "";
    if (/parents only|not a supervised member/i.test(m)) return bad("The server accepts a guardrail change only from a parent of this household", 403);
    return dbError(error);
  }
  return ok({ guardrails: data });
}
