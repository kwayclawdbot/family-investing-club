import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/db";
import { getSession, isAdmin } from "@/lib/live/session";
import { notConfiguredResponse } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/push/health — "did push survive the host move?" (BACKEND-CUTOVER-PLAN §5).
 *
 * Counts, for the last 24h: notifications created vs marked dispatched (the pg_net
 * trigger → /api/push/dispatch round-trip), how many are still undispatched, and the
 * live push_subscriptions + email-fallback queue. A healthy deploy shows
 * `undispatched` ≈ 0 and `dispatch_rate` ≈ 1; a silent trigger shows created > 0
 * and dispatched = 0.
 *
 * Auth: `x-push-secret: PUSH_DISPATCH_SECRET` (ops / curl) OR a signed-in admin cookie.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.PUSH_DISPATCH_SECRET?.trim();
  const bySecret = Boolean(secret) && req.headers.get("x-push-secret") === secret;
  if (!bySecret) {
    const session = await getSession();
    if (!isAdmin(session)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = createAdminClient();
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [created, dispatched, undispatched, subs, subsSeen, queued, sentEmail] = await Promise.all([
      db.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", since).not("dispatched_at", "is", null),
      db.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", since).is("dispatched_at", null),
      db.from("push_subscriptions").select("id", { count: "exact", head: true }),
      db.from("push_subscriptions").select("id", { count: "exact", head: true }).gte("last_seen_at", since),
      db.from("notification_email_queue").select("id", { count: "exact", head: true }).is("sent_at", null),
      db.from("notification_email_queue").select("id", { count: "exact", head: true }).gte("sent_at", since),
    ]);
    const c = created.count ?? 0;
    const d = dispatched.count ?? 0;
    const vapid = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
    const status = !vapid ? "vapid_not_configured" : c > 0 && d === 0 ? "trigger_silent" : (undispatched.count ?? 0) > 5 ? "backlog" : "ok";
    return NextResponse.json({
      ok: status === "ok",
      status,
      window_hours: 24,
      notifications: { created: c, dispatched: d, undispatched: undispatched.count ?? 0, dispatch_rate: c ? Number((d / c).toFixed(3)) : null },
      push_subscriptions: { total: subs.count ?? 0, seen_24h: subsSeen.count ?? 0 },
      email_fallback: { queued: queued.error ? null : queued.count ?? 0, sent_24h: sentEmail.error ? null : sentEmail.count ?? 0 },
      vapid_configured: vapid,
      dispatch_secret_configured: Boolean(secret),
    });
  } catch (e) {
    return notConfiguredResponse(e) ?? NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
