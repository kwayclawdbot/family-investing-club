import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

const AUD = new Set(["all", "fic", "fta", "free"]);

/**
 * POST /api/admin/push { title, body, audience, link?, test? } — FTA `admin_push_broadcast`. Inserts `notifications`
 * rows; the DB hook `dispatch_push_notification()` fans them out to devices (Phase 6 push dispatch).
 */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ title?: string; body?: string; audience?: string; link?: string; test?: boolean }>(req);
  const title = (b.title ?? "").trim();
  if (!title) return bad("Give your push a title");
  const { data, error } = await r.supa.rpc("admin_push_broadcast", { p_title: title.slice(0, 140), p_body: (b.body ?? "").trim(), p_link: b.link?.trim() || null, p_audience: AUD.has(b.audience ?? "") ? b.audience : "all", p_test: b.test === true });
  if (error) return dbError(error);
  return ok(data as Record<string, unknown>);
}
