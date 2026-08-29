"use client";
/**
 * Browser wrappers for the club / community / notifications routes (Lane CLUB). Same shape as
 * `client.ts`, plus the HTTP status so a sheet can keep the local demo path ONLY on 401 (signed out)
 * and surface every other refusal (kid wall, guardrails, vote gate) as a message.
 */
import type { Club, ClubProposal } from "@/lib/types";
import type { BeltColor } from "@/lib/types";

export type Res<T = Record<string, never>> = ({ ok: true } & T) | { ok: false; error: string; status: number; code?: string };
export const signedOut = (r: { ok: boolean; status?: number }) => !r.ok && r.status === 401;

async function call<T>(path: string, body?: unknown, method: "GET" | "POST" | "PATCH" | "DELETE" = "POST"): Promise<Res<T>> {
  try {
    const r = await fetch(`/api${path}`, { method, headers: { "Content-Type": "application/json" }, body: body && method !== "GET" ? JSON.stringify(body) : undefined, cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j.error ?? `HTTP ${r.status}`, status: r.status, code: j.code };
    return { ok: true, ...j };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network", status: 0 };
  }
}

export type CircleLite = { id: string; slug: string; name: string; emoji: string; symbol?: string; daysLeft: number; people: number; open: boolean; joined: boolean };
export type Me = { id: string; name: string; initial: string; color: string; belt: BeltColor; beltLabel: string; lifetimeXp: number };
export type Context = { club: Club | null; circles: CircleLite[]; chatAvailable: boolean; me: Me; proposal: ClubProposal | null };

export const clubApi = {
  /* reads for sheets that open without server props */
  context: (proposalId?: string) => call<Context>(`/club/context${proposalId ? `?proposalId=${encodeURIComponent(proposalId)}` : ""}`, undefined, "GET"),
  notifications: () => call<{ items: { id: string; read: boolean }[]; unread: number }>("/notifications", undefined, "GET"),
  /* club */
  pick: (b: { symbol: string; companyName?: string; stance: "buy" | "watch" | "pass"; reason: string; horizon: "1y" | "3y" | "5y+"; confidence: number; visibility?: "club" | "public" }) => call<{ id: string; xp: number }>("/club/pick", b),
  ask: (question: string, symbol?: string) => call<{ id: string; xp: number }>("/club/ask", { question, symbol }),
  deleteAsk: (id: string) => call<{ id: string }>("/club/ask", { id }, "DELETE"),
  vote: (proposalId: string, vote: "for" | "against") => call<{ status: string; xp: number }>("/club/vote", { proposalId, vote }),
  react: (pickId: string, kind: "agree" | "not_sure") => call("/club/pick/react", { pickId, kind }),
  reply: (pickId: string, body: string) => call<{ id: string; xp: number }>("/club/pick/reply", { pickId, body }),
  deleteReply: (id: string) => call<{ id: string }>("/club/pick/reply", { id }, "DELETE"),
  research: (b: { symbol: string; companyName?: string; assigneeId?: string | null; reason?: string; dueLabel?: string }) => call<{ id: string }>("/club/research", b),
  researchUpdate: (b: { id: string; status?: "open" | "ready" | "done"; notes?: string; assigneeId?: string | null }) => call("/club/research", b, "PATCH"),
  chat: (body: string) => call<{ id: string }>("/club/chat", { body }),
  /* community (FTA feed / rooms / circles) */
  post: (b: { text: string; title?: string; tickers?: string[]; position?: "bull" | "neutral" | "bear"; poll?: string[]; artifact?: string }) => call<{ id: string }>("/community/post", b),
  deletePost: (id: string) => call<{ id: string }>("/community/post", { id }, "DELETE"),
  like: (postId: string) => call<{ liked: boolean }>("/community/post/like", { postId }),
  comment: (postId: string, body: string) => call<{ id: string; xp: number }>("/community/post/comment", { postId, body }),
  roomSend: (roomId: string, content: string, replyToId?: string) => call<{ id: string }>("/community/chat", { roomId, content, replyToId }),
  openCircle: (b: { title: string; topic?: string; premise: string; ticker?: string; days?: number }) => call<{ id: string; slug: string }>("/community/circle", b),
  joinCircle: (circleId: string, join = true) => call<{ joined: boolean }>("/community/circle/join", { circleId, join }),
  circleNote: (circleId: string, body: string, stance?: "bear" | "neutral" | "bull" | null) => call<{ id: string }>("/community/circle/note", { circleId, body, stance }),
  /* notifications */
  ack: (id?: string) => call<{ acked: number }>("/notifications/ack", id ? { id } : { all: true }),
};

export const isUuid = (s: string | null | undefined) => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
