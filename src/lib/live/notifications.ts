import "server-only";
import type { Notification } from "@/lib/types";
import { getSession } from "./session";
import { ago, must, safe, userClient } from "./supa";

type Row = { id: string; kind: string | null; title: string | null; body: string | null; href: string | null; url: string | null; read: boolean | null; read_at: string | null; created_at: string; payload: Record<string, unknown> | null };

export async function getNotifications(): Promise<Notification[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("notifications.get", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("notifications").select("*").eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(30)) as Row[];
    if (!rows.length) return null;
    return rows.map((r) => {
      const k = (r.kind ?? "").toLowerCase();
      const kind: Notification["kind"] = k.includes("lesson") || k.includes("learn") ? "lesson" : k.includes("family") ? "family" : k.includes("club") || k.includes("pick") || k.includes("vote") ? "club" : k.includes("live") ? "live" : "system";
      const href = r.href ?? r.url ?? (typeof r.payload?.href === "string" ? (r.payload.href as string) : "/home");
      return { id: r.id, kind, title: r.title ?? "Update", body: r.body ?? "", ago: ago(r.created_at) + " ago", href, read: !!(r.read ?? r.read_at) };
    });
  });
}
