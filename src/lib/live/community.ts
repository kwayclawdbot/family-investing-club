import "server-only";
import type { CommunityChat, CommunityClub, CommunityPost, PickStance } from "@/lib/types";
import { getSession } from "./session";
import { quoteSafe } from "./market-bridge";
import { ago, must, safe, userClient } from "./supa";

type PickRow = { id: string; author_id: string; symbol: string; company_name: string | null; stance: PickStance; reason: string; price_at_pick: number | null; verified_owner: boolean; created_at: string };
type FeedRow = { id: string; author_id: string; kind: string | null; body: string | null; ticker_tags: string[] | null; position: string | null; created_at: string; title: string | null };
type ClubRow = { id: string; name: string; short_name: string | null; kind: string; created_at: string };

export async function getCommunityPosts(): Promise<CommunityPost[] | null> {
  return safe("community.getCommunityPosts", async () => {
    const supa = await userClient();
    const [picks, feed] = await Promise.all([
      supa.from("fic_club_picks").select("id, author_id, symbol, company_name, stance, reason, price_at_pick, verified_owner, created_at").eq("visibility", "public").order("created_at", { ascending: false }).limit(20),
      supa.from("feed_posts").select("id, author_id, kind, body, ticker_tags, position, created_at, title").eq("audience", "public").order("created_at", { ascending: false }).limit(20),
    ]);
    const pr = (picks.data ?? []) as PickRow[];
    const fr = (feed.data ?? []) as FeedRow[];
    if (!pr.length && !fr.length) return null;
    const authors = [...new Set([...pr.map((p) => p.author_id), ...fr.map((f) => f.author_id)])];
    const profs = authors.length ? ((await supa.from("profiles").select("id, display_name").in("id", authors)).data ?? []) as { id: string; display_name: string | null }[] : [];
    const nameOf = (id: string) => profs.find((p) => p.id === id)?.display_name ?? "Member";
    const posts: CommunityPost[] = [];
    for (const p of pr) {
      const q = p.price_at_pick ? await quoteSafe(p.symbol) : null;
      posts.push({ kind: "pick", id: p.id, author: nameOf(p.author_id), authorId: p.author_id, ago: ago(p.created_at), symbol: p.symbol, name: p.company_name ?? p.symbol, stance: p.stance, reason: p.reason, sincePct: q && p.price_at_pick ? +(((q.price - Number(p.price_at_pick)) / Number(p.price_at_pick)) * 100).toFixed(1) : 0, verified: p.verified_owner || undefined, likes: 0, comments: 0, views: 0 });
    }
    for (const f of fr) {
      const sym = f.ticker_tags?.[0];
      if (!sym) continue;
      const stance: PickStance = (f.position ?? "").toLowerCase().includes("bear") || (f.position ?? "").toLowerCase().includes("pass") ? "pass" : (f.position ?? "").toLowerCase().includes("watch") ? "watch" : "buy";
      posts.push({ kind: "pick", id: f.id, author: nameOf(f.author_id), authorId: f.author_id, ago: ago(f.created_at), symbol: sym, name: sym, stance, reason: (f.title ?? f.body ?? "").slice(0, 140), sincePct: 0, likes: 0, comments: 0, views: 0 });
    }
    return posts;
  });
}

export async function getCommunityChats(): Promise<CommunityChat[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("community.getCommunityChats", async () => {
    const supa = await userClient();
    const mem = must(await supa.from("chat_room_members").select("room_id").eq("user_id", s.user.id)) as { room_id: string }[];
    if (!mem.length) return null;
    const ids = mem.map((m) => m.room_id);
    const [rooms, last] = await Promise.all([
      supa.from("chat_rooms").select("id, type, name").in("id", ids),
      supa.from("chat_messages").select("room_id, content, created_at").in("room_id", ids).order("created_at", { ascending: false }).limit(200),
    ]);
    const rs = (rooms.data ?? []) as { id: string; type: string | null; name: string | null }[];
    const ms = (last.data ?? []) as { room_id: string; content: string | null; created_at: string }[];
    return rs.map((r) => {
      const m = ms.find((x) => x.room_id === r.id);
      return { id: r.id, name: r.name ?? r.type ?? "Room", emoji: (r.type ?? "").includes("family") ? "🏠" : "💬", members: 0, last: m?.content ?? "", ago: ago(m?.created_at) };
    });
  });
}

export async function getCommunityClubs(): Promise<CommunityClub[] | null> {
  return safe("community.getCommunityClubs", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_clubs").select("id, name, short_name, kind, created_at").eq("privacy", "public").limit(20)) as ClubRow[];
    if (!rows.length) return null;
    const counts = await Promise.all(rows.map(async (r) => (await supa.from("fic_club_members").select("user_id", { count: "exact", head: true }).eq("club_id", r.id)).count ?? 0));
    return rows.map((r, i) => ({ id: r.id, name: r.short_name ?? r.name, emoji: r.kind === "family" ? "👨‍👩‍👧" : "🌱", members: counts[i], blurb: `Public ${r.kind} club · votes visible` }));
  });
}
