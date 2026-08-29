import "server-only";
import type { Notification } from "@/lib/types";
import { getSession } from "./session";
import { ago, firstName, must, safe, userClient } from "./supa";

/* FTA `notifications` (migration 028 + later types): one row per event, written only by SECURITY DEFINER
 * triggers (chat replies/@mentions, feed comments, announcements, Kai alerts, new lessons). Members may
 * update ONLY read_at (column grant) — that is the ack. */
type Row = { id: string; type: string; body: string; link: string | null; ref_id: string | null; actor_id: string | null; read_at: string | null; created_at: string };

export type LiveNotification = Notification & { type: string; actorId: string | null; actorName: string | null; createdAt: string };

function kindOf(t: string): Notification["kind"] {
  const k = t.toLowerCase();
  if (k.includes("lesson") || k.includes("learn") || k.includes("quiz")) return "lesson";
  if (k.includes("family") || k.includes("guardrail")) return "family";
  if (k.includes("record") || k.includes("live") || k.includes("session")) return "live";
  if (k === "reply" || k === "mention" || k.includes("pick") || k.includes("vote") || k.includes("comment") || k.includes("club")) return "club";
  return "system";
}
function titleOf(t: string, actor: string | null): string {
  const who = actor ?? "Someone";
  switch (t) {
    case "reply": return `${who} replied to you`;
    case "mention": return `${who} mentioned you`;
    case "announcement": return "Club announcement";
    case "alert": return "Kai alert";
    case "new_lesson": return "New lesson";
    case "recording": return "Recording posted";
    default: return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export async function getNotificationsDetailed(limit = 40): Promise<LiveNotification[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("notifications.getDetailed", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("notifications").select("id, type, body, link, ref_id, actor_id, read_at, created_at").eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(limit)) as Row[];
    if (!rows.length) return [];
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((x): x is string => !!x))];
    const profs = actorIds.length ? (((await supa.from("profiles").select("id, display_name, email").in("id", actorIds)).data ?? []) as { id: string; display_name: string | null; email: string | null }[]) : [];
    const nameOf = (id: string | null) => { const p = id ? profs.find((x) => x.id === id) : null; return p ? firstName(p.display_name, p.email) : null; };
    return rows.map((r) => {
      const actor = nameOf(r.actor_id);
      return { id: r.id, kind: kindOf(r.type), type: r.type, title: titleOf(r.type, actor), body: r.body ?? "", ago: ago(r.created_at), href: r.link ?? "/home", read: !!r.read_at, actorId: r.actor_id, actorName: actor, createdAt: r.created_at };
    });
  });
}

/** Shape used by the data-live facade (`Notification[]`). */
export async function getNotifications(): Promise<Notification[] | null> {
  const rows = await getNotificationsDetailed(30);
  if (!rows) return null;
  return rows.map(({ id, kind, title, body, ago: a, href, read }) => ({ id, kind, title, body, ago: a + " ago", href, read }));
}

export async function unreadCount(): Promise<number> {
  const s = await getSession();
  if (!s) return 0;
  const n = await safe("notifications.unread", async () => {
    const supa = await userClient();
    const { count } = await supa.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).is("read_at", null);
    return count ?? 0;
  });
  return n ?? 0;
}
