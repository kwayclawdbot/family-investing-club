import "server-only";
import type { BeltColor, CommunityChat, CommunityClub, CommunityPost, PickStance } from "@/lib/types";
import { beltFor } from "@/lib/belts";
import { getSession } from "./session";
import { identitiesFor } from "./identity";
import { quoteSafe } from "./market-bridge";
import { ago, colorFor, firstName, initialOf, must, safe, userClient } from "./supa";

/* ── people: names + belts for any set of author ids ───────────────
 * profiles RLS decides who resolves (own household + whatever FTA exposes); unknowns render as "Member".
 * Belts come from xp_events — only club-mates are visible under RLS, so strangers get no chip rather than a wrong one. */
export type Person = { id: string; name: string; initial: string; color: string; belt: BeltColor | null; beltLabel?: string; child: boolean };
export async function people(ids: (string | null | undefined)[]): Promise<Map<string, Person>> {
  const supa = await userClient();
  const uniq = [...new Set(ids.filter((x): x is string => !!x))];
  if (!uniq.length) return new Map();
  const profs = ((await supa.from("profiles").select("id, display_name, email, role, age_group").in("id", uniq)).data ?? []) as { id: string; display_name: string | null; email: string | null; role: string | null; age_group: string | null }[];
  const named = uniq.map((id) => { const p = profs.find((x) => x.id === id); return { id, p, name: p ? firstName(p.display_name, p.email) : "Member" }; });
  const xp = (await identitiesFor(named.map((n) => ({ id: n.id, name: n.name })))) ?? [];
  return new Map(named.map((n) => {
    const life = xp.find((i) => i.memberId === n.id)?.lifetimeXp ?? 0;
    const b = life > 0 ? beltFor(life) : null;
    const child = n.p?.role === "child" || n.p?.age_group === "kids" || n.p?.age_group === "teens";
    return [n.id, { id: n.id, name: n.name, initial: initialOf(n.name), color: colorFor(n.id), belt: b?.color ?? null, beltLabel: b?.short, child }];
  }));
}

/* ── the shared feed (FTA feed_posts, kind='post') ──────────────────
 * Shared with FTA until cutover. The kid wall (214) and guardrails are RLS — a refused write surfaces as a message. */
type FeedRow = { id: string; author_id: string | null; body: string; title: string | null; ticker_tags: string[] | null; position: "bull" | "neutral" | "bear" | null; activity_payload: Record<string, unknown> | null; created_at: string; author_register: string };
export type FeedItem = {
  id: string; author: Person; ago: string; at: string; text: string; title?: string; tickers: string[]; position: "bull" | "neutral" | "bear" | null;
  likes: number; likedByMe: boolean; comments: number; poll?: string[]; artifact?: string; mine: boolean;
};
export async function getFeed(limit = 30): Promise<FeedItem[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("community.getFeed", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("feed_posts").select("id, author_id, body, title, ticker_tags, position, activity_payload, created_at, author_register").eq("kind", "post").order("created_at", { ascending: false }).limit(limit)) as FeedRow[];
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [likes, comments, ppl] = await Promise.all([
      supa.from("post_likes").select("post_id, user_id").in("post_id", ids),
      supa.from("post_comments").select("post_id").in("post_id", ids),
      people(rows.map((r) => r.author_id)),
    ]);
    const ls = (likes.data ?? []) as { post_id: string; user_id: string }[];
    const cs = (comments.data ?? []) as { post_id: string }[];
    const anon: Person = { id: "", name: "Club", initial: "C", color: "bg-ink-4", belt: null, child: false };
    return rows.map((r) => {
      const pl = (r.activity_payload ?? {}) as { poll?: unknown; artifact?: unknown };
      const poll = Array.isArray(pl.poll) ? (pl.poll as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 4) : undefined;
      return {
        id: r.id, author: (r.author_id && ppl.get(r.author_id)) || anon, ago: ago(r.created_at), at: r.created_at,
        text: r.body, title: r.title ?? undefined, tickers: (r.ticker_tags ?? []).map((t) => t.toUpperCase()), position: r.position,
        likes: ls.filter((l) => l.post_id === r.id).length, likedByMe: ls.some((l) => l.post_id === r.id && l.user_id === s.user.id),
        comments: cs.filter((c) => c.post_id === r.id).length, poll: poll?.length ? poll : undefined,
        artifact: typeof pl.artifact === "string" ? pl.artifact : undefined, mine: r.author_id === s.user.id,
      };
    });
  });
}

export type FeedComment = { id: string; author: Person; ago: string; text: string; mine: boolean };
export async function getFeedComments(postId: string): Promise<FeedComment[] | null> {
  const s = await getSession();
  if (!s || !/^[0-9a-f-]{36}$/i.test(postId)) return null;
  return safe("community.getFeedComments", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("post_comments").select("id, author_id, body, created_at").eq("post_id", postId).order("created_at")) as { id: string; author_id: string | null; body: string; created_at: string }[];
    const ppl = await people(rows.map((r) => r.author_id));
    const anon: Person = { id: "", name: "Member", initial: "M", color: "bg-ink-4", belt: null, child: false };
    return rows.map((r) => ({ id: r.id, author: (r.author_id && ppl.get(r.author_id)) || anon, ago: ago(r.created_at), text: r.body, mine: r.author_id === s.user.id }));
  });
}

/* ── Community hub feed (public picks + ticker-tagged posts) — kept for /community ── */
type PickRow = { id: string; author_id: string; symbol: string; company_name: string | null; stance: PickStance; reason: string; price_at_pick: number | null; verified_owner: boolean; created_at: string };
export async function getCommunityPosts(): Promise<CommunityPost[] | null> {
  return safe("community.getCommunityPosts", async () => {
    const supa = await userClient();
    const [picks, feed] = await Promise.all([
      supa.from("fic_club_picks").select("id, author_id, symbol, company_name, stance, reason, price_at_pick, verified_owner, created_at").eq("visibility", "public").order("created_at", { ascending: false }).limit(20),
      getFeed(20),
    ]);
    const pr = (picks.data ?? []) as PickRow[];
    const fr = (feed ?? []).filter((f) => f.tickers.length);
    if (!pr.length && !fr.length) return [];
    const ppl = await people(pr.map((p) => p.author_id));
    const posts: CommunityPost[] = [];
    for (const p of pr) {
      const q = p.price_at_pick ? await quoteSafe(p.symbol) : null;
      posts.push({ kind: "pick", id: p.id, author: ppl.get(p.author_id)?.name ?? "Member", authorId: p.author_id, ago: ago(p.created_at), symbol: p.symbol, name: p.company_name ?? p.symbol, stance: p.stance, reason: p.reason, sincePct: q && p.price_at_pick ? +(((q.price - Number(p.price_at_pick)) / Number(p.price_at_pick)) * 100).toFixed(1) : 0, verified: p.verified_owner || undefined, likes: 0, comments: 0, views: 0 });
    }
    for (const f of fr) {
      const stance: PickStance = f.position === "bear" ? "pass" : f.position === "neutral" ? "watch" : "buy";
      posts.push({ kind: "pick", id: f.id, author: f.author.name, authorId: f.author.id || undefined, belt: f.author.beltLabel, ago: f.ago, symbol: f.tickers[0], name: f.tickers[0], stance, reason: (f.title ?? f.text).slice(0, 140), sincePct: 0, likes: f.likes, comments: f.comments, views: 0 });
    }
    return posts;
  });
}

/* ── community rooms (FTA chat_rooms type='general'; messages on chat_messages) ── */
const ROOM_EMOJI: Record<string, string> = { "FIC Club": "🏠", "FTA Traders": "📈", "Free Lounge": "☕", "Semis & AI infra": "🤖", "Macro & rates": "🏛", "First 100 days": "🌱", "General Chat": "💬" };
type RoomRow = { id: string; type: string | null; name: string | null };
export async function getCommunityChats(): Promise<CommunityChat[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("community.getCommunityChats", async () => {
    const supa = await userClient();
    const rooms = must(await supa.from("chat_rooms").select("id, type, name").order("created_at")) as RoomRow[];
    if (!rooms.length) return [];
    const ids = rooms.map((r) => r.id);
    const last = ((await supa.from("chat_messages").select("room_id, user_id, content, created_at").in("room_id", ids).order("created_at", { ascending: false }).limit(300)).data ?? []) as { room_id: string; user_id: string; content: string | null; created_at: string }[];
    return rooms.map((r) => {
      const mine = last.filter((m) => m.room_id === r.id);
      const m = mine[0];
      return { id: r.id, name: r.name ?? r.type ?? "Room", emoji: ROOM_EMOJI[r.name ?? ""] ?? "💬", members: new Set(mine.map((x) => x.user_id)).size, last: m?.content ?? "No messages yet", ago: ago(m?.created_at) };
    });
  });
}

export type RoomMessage = { id: string; author: Person; text: string; ago: string; time: string; mine: boolean; replyToId?: string };
export type Room = { room: CommunityChat; messages: RoomMessage[]; canPost: boolean; kidOnlyRoom: boolean };
export const MAIN_CIRCLE_ROOM = "c0000000-0000-4000-a000-000000000001";
export async function getRoom(roomId: string): Promise<Room | null> {
  const s = await getSession();
  if (!s || !/^[0-9a-f-]{36}$/i.test(roomId)) return null;
  return safe("community.getRoom", async () => {
    const supa = await userClient();
    const room = must(await supa.from("chat_rooms").select("id, type, name").eq("id", roomId).maybeSingle()) as RoomRow | null;
    if (!room) return null;
    const rows = must(await supa.from("chat_messages").select("id, user_id, content, reply_to_id, created_at").eq("room_id", roomId).order("created_at", { ascending: false }).limit(80)) as { id: string; user_id: string; content: string | null; reply_to_id: string | null; created_at: string }[];
    const ppl = await people(rows.map((r) => r.user_id));
    const anon: Person = { id: "", name: "Member", initial: "M", color: "bg-ink-4", belt: null, child: false };
    const kid = s.profile?.age_group === "kids" || (s.profile?.role === "child" && !s.profile?.age_group);
    return {
      room: { id: room.id, name: room.name ?? "Room", emoji: ROOM_EMOJI[room.name ?? ""] ?? "💬", members: new Set(rows.map((r) => r.user_id)).size, last: rows[0]?.content ?? "", ago: ago(rows[0]?.created_at) },
      messages: rows.slice().reverse().map((r) => ({ id: r.id, author: ppl.get(r.user_id) ?? anon, text: r.content ?? "", ago: ago(r.created_at), time: new Date(r.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), mine: r.user_id === s.user.id, replyToId: r.reply_to_id ?? undefined })),
      canPost: !kid || roomId === MAIN_CIRCLE_ROOM,
      kidOnlyRoom: roomId === MAIN_CIRCLE_ROOM,
    };
  });
}

/* ── public clubs ───────────────────────────────────────────────────── */
type ClubRow = { id: string; name: string; short_name: string | null; kind: string; created_at: string };
export async function getCommunityClubs(): Promise<CommunityClub[] | null> {
  return safe("community.getCommunityClubs", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("fic_clubs").select("id, name, short_name, kind, created_at").eq("privacy", "public").limit(20)) as ClubRow[];
    if (!rows.length) return null;
    const counts = await Promise.all(rows.map(async (r) => (await supa.from("fic_club_members").select("user_id", { count: "exact", head: true }).eq("club_id", r.id)).count ?? 0));
    return rows.map((r, i) => ({ id: r.id, name: r.short_name ?? r.name, emoji: r.kind === "family" ? "👨‍👩‍👧" : "🌱", members: counts[i], blurb: `Public ${r.kind} club · votes visible` }));
  });
}

/* ── circles (FTA club_circles: 30-day rooms around one event or thesis) ──
 * Kids may read a circle but not open, join or post (RLS, migration 191). */
type CircleRow = { id: string; slug: string; title: string; topic: string; premise: string; ticker: string | null; created_by: string; created_at: string; expires_at: string };
const STYLE = [
  { emoji: "📊", color: "#4C8C4A", tint: "#EAF2E3" }, { emoji: "🏛", color: "#E58234", tint: "#FBEDD9" }, { emoji: "🤖", color: "#6B5CA8", tint: "#EFEBF8" },
  { emoji: "⚡", color: "#E9B949", tint: "#FFFDF4" }, { emoji: "🍎", color: "#8B7BC7", tint: "#F5F0E4" }, { emoji: "🔬", color: "#3E7BC7", tint: "#E1ECFA" },
];
const TOPIC_EMOJI: [RegExp, string][] = [[/earn/i, "📊"], [/fed|macro|rate/i, "🏛"], [/ai|semi|chip/i, "🤖"], [/energy|uranium|nuclear|power/i, "⚡"], [/apple|event|launch/i, "🍎"], [/research|thesis/i, "🔬"]];
function styleFor(c: CircleRow) {
  let h = 0; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = STYLE[h % STYLE.length];
  const emoji = TOPIC_EMOJI.find(([re]) => re.test(c.topic) || re.test(c.title))?.[1] ?? base.emoji;
  return { ...base, emoji };
}
export type CircleView = {
  id: string; slug: string; name: string; topic: string; premise: string; symbol?: string; daysLeft: number; people: number; notes: number;
  emoji: string; color: string; tint: string; open: boolean; joined: boolean; createdBy: string; context: string; consensus: string; expiresAt: string;
};
function toCircle(c: CircleRow, counts: Map<string, { members: number; notes: number }>, joined: Set<string>): CircleView {
  const st = styleFor(c);
  const left = Math.max(0, Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86400000));
  const n = counts.get(c.id) ?? { members: 0, notes: 0 };
  return {
    id: c.id, slug: c.slug, name: c.title, topic: c.topic, premise: c.premise, symbol: c.ticker ?? undefined, daysLeft: left, people: n.members, notes: n.notes,
    emoji: st.emoji, color: st.color, tint: st.tint, open: new Date(c.expires_at).getTime() > Date.now(), joined: joined.has(c.id), createdBy: c.created_by,
    context: c.premise, consensus: `${n.notes} ${n.notes === 1 ? "note" : "notes"} · ${n.members} in`, expiresAt: c.expires_at,
  };
}
async function circleCounts(): Promise<{ counts: Map<string, { members: number; notes: number }>; joined: Set<string> }> {
  const s = await getSession();
  const supa = await userClient();
  const [cnt, mine] = await Promise.all([
    supa.rpc("club_circle_counts"),
    s ? supa.from("club_circle_members").select("circle_id").eq("member_id", s.user.id) : Promise.resolve({ data: [] as { circle_id: string }[] }),
  ]);
  const counts = new Map(((cnt.data ?? []) as { circle_id: string; members: number; notes: number }[]).map((r) => [r.circle_id, { members: Number(r.members), notes: Number(r.notes) }]));
  return { counts, joined: new Set(((mine.data ?? []) as { circle_id: string }[]).map((m) => m.circle_id)) };
}
export async function getCircles(includeClosed = false): Promise<CircleView[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("community.getCircles", async () => {
    const supa = await userClient();
    let q = supa.from("club_circles").select("*").order("expires_at", { ascending: true }).limit(24);
    if (!includeClosed) q = q.gt("expires_at", new Date().toISOString());
    const rows = must(await q) as CircleRow[];
    if (!rows.length) return [];
    const { counts, joined } = await circleCounts();
    return rows.map((c) => toCircle(c, counts, joined));
  });
}

export type CircleNoteView = { id: string; author: Person; text: string; stance: "bear" | "neutral" | "bull" | null; ago: string; mine: boolean };
export type CircleRoomView = { circle: CircleView; notes: CircleNoteView[]; split: { bear: number; neutral: number; bull: number }; canPost: boolean; kidBlocked: boolean };
export async function getCircleRoom(idOrSlug: string): Promise<CircleRoomView | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("community.getCircleRoom", async () => {
    const supa = await userClient();
    const byId = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const row = must(await supa.from("club_circles").select("*").eq(byId ? "id" : "slug", idOrSlug).maybeSingle()) as CircleRow | null;
    if (!row) return null;
    const [{ counts, joined }, notes] = await Promise.all([
      circleCounts(),
      supa.from("club_circle_notes").select("id, author_id, body, stance, created_at").eq("circle_id", row.id).order("created_at").limit(120),
    ]);
    const ns = (notes.data ?? []) as { id: string; author_id: string; body: string; stance: "bear" | "neutral" | "bull" | null; created_at: string }[];
    const ppl = await people(ns.map((n) => n.author_id));
    const anon: Person = { id: "", name: "Member", initial: "M", color: "bg-ink-4", belt: null, child: false };
    const split = { bear: 0, neutral: 0, bull: 0 };
    const latest = new Map<string, "bear" | "neutral" | "bull">();
    for (const n of ns) if (n.stance) latest.set(n.author_id, n.stance);
    for (const st of latest.values()) split[st]++;
    const circle = toCircle(row, counts, joined);
    const kid = s.profile?.age_group === "kids" || (s.profile?.role === "child" && !s.profile?.age_group);
    return { circle, notes: ns.map((n) => ({ id: n.id, author: ppl.get(n.author_id) ?? anon, text: n.body, stance: n.stance, ago: ago(n.created_at), mine: n.author_id === s.user.id })), split, canPost: circle.open && circle.joined && !kid, kidBlocked: kid };
  });
}
