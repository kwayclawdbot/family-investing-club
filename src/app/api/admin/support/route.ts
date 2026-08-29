import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

const STATUS = new Set(["open", "pending", "resolved", "closed"]);

/**
 * POST /api/admin/support { action: 'reply', ticketId, body } | { action: 'set_status', ticketId, status }
 * Service role like FTA (help_* RLS is own-row only); the AFTER-INSERT trigger on help_messages notifies the member.
 */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const db = r.admin;
  if (!db) return bad("SUPABASE_SERVICE_ROLE_KEY not configured", 503);
  const b = await readJson<{ action?: string; ticketId?: string; body?: string; status?: string }>(req);
  if (!b.ticketId) return bad("ticketId required");
  const { data: t } = await db.from("help_tickets").select("id").eq("id", b.ticketId).maybeSingle();
  if (!t) return bad("Ticket not found", 404);
  if (b.action === "reply") {
    const text = (b.body ?? "").trim();
    if (!text) return bad("Write a reply first");
    const { error } = await db.from("help_messages").insert({ ticket_id: b.ticketId, sender: "team", body: text.slice(0, 5000) });
    if (error) return dbError(error);
    await db.from("help_tickets").update({ status: "pending", updated_at: new Date().toISOString(), last_message_at: new Date().toISOString() }).eq("id", b.ticketId).eq("status", "open");
    return ok();
  }
  if (b.action === "set_status") {
    if (!b.status || !STATUS.has(b.status)) return bad("Unknown status");
    const { error } = await db.from("help_tickets").update({ status: b.status, updated_at: new Date().toISOString() }).eq("id", b.ticketId);
    if (error) return dbError(error);
    return ok({ status: b.status });
  }
  return bad("Unknown action");
}
