/**
 * Shape of the row `public.dispatch_push_notification()` POSTs to /api/push/dispatch
 * (pg_net, AFTER INSERT on notifications). Pure validation so the smoke script can
 * dry-run the dispatcher's input contract without a server or a database.
 */
export type NotifType =
  | "reply" | "mention" | "announcement" | "support_reply" | "mention_everyone" | "new_pick"
  | "new_lesson" | "recording_posted" | "broadcast" | "alert" | "live_starting" | "challenge";

export const NOTIF_TYPES: readonly NotifType[] = [
  "reply", "mention", "announcement", "support_reply", "mention_everyone", "new_pick",
  "new_lesson", "recording_posted", "broadcast", "alert", "live_starting", "challenge",
];

export interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotifType;
  message_id: string | null;
  body: string;
  link: string | null;
  read_at: string | null;
  dispatched_at: string | null;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Accepts the trigger payload (the notification row; pg_net may wrap it as
 * `{ record: {...} }` or `{ notification: {...} }` depending on the trigger
 * version) and returns a normalised row or an error string. Unknown `type`
 * values are kept (dispatch sends them with a generic title) — only id/user_id
 * are hard requirements, matching FTA's `if (!n?.id || !n?.user_id)` guard.
 */
export function parseNotificationPayload(input: unknown): { ok: true; row: NotificationRow } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "bad body" };
  const o = input as Record<string, unknown>;
  const inner = (o.record ?? o.notification ?? o.new ?? o) as Record<string, unknown>;
  if (!inner || typeof inner !== "object") return { ok: false, error: "bad body" };
  const id = typeof inner.id === "string" ? inner.id : "";
  const userId = typeof inner.user_id === "string" ? inner.user_id : "";
  if (!id || !userId) return { ok: false, error: "bad body" };
  if (!UUID_RE.test(id) || !UUID_RE.test(userId)) return { ok: false, error: "bad id" };
  const type = typeof inner.type === "string" ? (inner.type as NotifType) : ("announcement" as NotifType);
  return {
    ok: true,
    row: {
      id,
      user_id: userId,
      actor_id: typeof inner.actor_id === "string" ? inner.actor_id : null,
      type,
      message_id: typeof inner.message_id === "string" ? inner.message_id : null,
      body: typeof inner.body === "string" ? inner.body : "",
      link: typeof inner.link === "string" ? inner.link : null,
      read_at: typeof inner.read_at === "string" ? inner.read_at : null,
      dispatched_at: typeof inner.dispatched_at === "string" ? inner.dispatched_at : null,
      created_at: typeof inner.created_at === "string" ? inner.created_at : new Date().toISOString(),
    },
  };
}
