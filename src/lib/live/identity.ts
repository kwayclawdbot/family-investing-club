import "server-only";
import type { Badge, Mastery, MemberIdentity, PromotionSummary, Reputation, User, XpEvent } from "@/lib/types";
import { beltAtLevel, eligibleBeltFor } from "@/lib/belts";
import { getSession, levelOf } from "./session";
import { quotesSafe } from "./market-bridge";
import { colorFor, firstName, initialOf, must, safe, userClient } from "./supa";

type XpRow = { id: string; user_id: string; amount: number; kind: string | null; ref_id: string | null; created_at: string };

const KIND_MAP: Record<string, { emoji: string; kind: XpEvent["kind"]; label: string }> = {
  lesson: { emoji: "📚", kind: "learn", label: "Lesson" },
  quiz: { emoji: "⭐", kind: "learn", label: "Quiz" },
  flashcard: { emoji: "🃏", kind: "learn", label: "Review" },
  research: { emoji: "🔍", kind: "research", label: "Research" },
  pick: { emoji: "▲", kind: "club", label: "Pick" },
  ask: { emoji: "💬", kind: "club", label: "Asked the club" },
  vote: { emoji: "🗳", kind: "club", label: "Vote" },
  proposal: { emoji: "🗳", kind: "club", label: "Proposal" },
  practice: { emoji: "🎯", kind: "practice", label: "Practice" },
  game: { emoji: "🧩", kind: "practice", label: "Game" },
  family: { emoji: "📅", kind: "family", label: "Family" },
  family_night: { emoji: "📅", kind: "family", label: "Family Investing Night" },
};
function describe(kind: string | null): { emoji: string; kind: XpEvent["kind"]; label: string } {
  const k = (kind ?? "").toLowerCase();
  for (const key of Object.keys(KIND_MAP)) if (k.includes(key)) return KIND_MAP[key];
  return { emoji: "✨", kind: "learn", label: kind ?? "Activity" };
}

export async function xpTotals(userId: string): Promise<{ lifetime: number; week: number; today: number } | null> {
  return safe("identity.xpTotals", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("xp_events").select("amount, created_at").eq("user_id", userId)) as { amount: number; created_at: string }[];
    const now = Date.now();
    const week = now - 7 * 86400000;
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    let lifetime = 0, w = 0, t = 0;
    for (const r of rows) {
      lifetime += r.amount ?? 0;
      const ts = new Date(r.created_at).getTime();
      if (ts >= week) w += r.amount ?? 0;
      if (ts >= dayStart.getTime()) t += r.amount ?? 0;
    }
    return { lifetime, week: w, today: t };
  });
}

export async function getUser(): Promise<User | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getUser", async () => {
    const supa = await userClient();
    const [xp, lessons] = await Promise.all([
      xpTotals(s.user.id),
      supa.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", s.user.id).eq("status", "completed"),
    ]);
    const lifetime = xp?.lifetime ?? 0;
    const awarded = (await awardedLevels([s.user.id]))[s.user.id] ?? 1;
    const belt = eligibleBeltFor(lifetime);
    const next = [150, 400, 800, 1400, 2200, 3200].find((m) => m > lifetime) ?? lifetime;
    const name = s.profile?.display_name ?? "";
    const parts = name.trim().split(/\s+/);
    return {
      id: s.user.id,
      firstName: firstName(name, s.user.email),
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
      level: belt.level,
      awardedLevel: awarded,
      levelXp: lifetime,
      levelXpMax: next,
      weekXp: xp?.week ?? 0,
      streakDays: 0,
      lessonsDone: lessons.count ?? 0,
      explanationLevel: levelOf(s.profile),
      dailyGoalXp: 20,
      todayXp: xp?.today ?? 0,
    };
  });
}

/** Highest belt level passed, per user. No row = level 1, the belt everyone starts at. */
async function awardedLevels(ids: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!ids.length) return out;
  const supa = await userClient();
  const res = await supa.from("fic_belt_awards").select("user_id, belt_level").in("user_id", ids);
  for (const r of (res.data ?? []) as { user_id: string; belt_level: number }[]) {
    out[r.user_id] = Math.max(out[r.user_id] ?? 1, r.belt_level);
  }
  return out;
}

export async function getIdentity(): Promise<MemberIdentity | null> {
  const s = await getSession();
  if (!s) return null;
  const xp = await xpTotals(s.user.id);
  if (!xp) return null;
  const name = firstName(s.profile?.display_name, s.user.email);
  const awarded = await awardedLevels([s.user.id]);
  return { memberId: s.user.id, name, initial: initialOf(name), color: colorFor(s.user.id), lifetimeXp: xp.lifetime, weekXp: xp.week, awardedLevel: awarded[s.user.id] ?? 1 };
}

/** Identities for a set of users (club members). Uses the member's own visibility (RLS on xp_events may limit to self). */
export async function identitiesFor(members: { id: string; name: string }[]): Promise<MemberIdentity[] | null> {
  return safe("identity.identitiesFor", async () => {
    const supa = await userClient();
    const ids = members.map((m) => m.id);
    const rows = must(await supa.from("xp_events").select("user_id, amount, created_at").in("user_id", ids)) as XpRow[];
    const awarded = await awardedLevels(ids);
    const week = Date.now() - 7 * 86400000;
    return members.map((m) => {
      const mine = rows.filter((r) => r.user_id === m.id);
      return {
        memberId: m.id, name: m.name, initial: initialOf(m.name), color: colorFor(m.id),
        lifetimeXp: mine.reduce((a, r) => a + (r.amount ?? 0), 0),
        weekXp: mine.filter((r) => new Date(r.created_at).getTime() >= week).reduce((a, r) => a + (r.amount ?? 0), 0),
        awardedLevel: awarded[m.id] ?? 1,
      };
    });
  });
}

export async function getRecentXp(): Promise<XpEvent[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getRecentXp", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("xp_events").select("id, amount, kind, ref_id, created_at").eq("user_id", s.user.id).order("created_at", { ascending: false }).limit(8)) as XpRow[];
    return rows.map((r) => {
      const d = describe(r.kind);
      const ago = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
      return { id: r.id, emoji: d.emoji, text: r.ref_id ? `${d.label}: ${r.ref_id}` : d.label, xp: r.amount, kind: d.kind, ago: ago === 0 ? "today" : ago === 1 ? "yesterday" : `${ago}d ago` };
    });
  });
}

const BADGE_EMOJI: Record<string, string> = { first: "🌱", lesson: "📚", trade: "📈", quiz: "⭐", divers: "🧺", streak: "🔥", research: "🔍", family: "👨‍👩‍👧‍👦", chart: "📊", debate: "💬" };
export async function getBadges(): Promise<Badge[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getBadges", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("user_badges").select("badge_id, earned_at, badges(id, slug, title, icon_url)").eq("user_id", s.user.id)) as unknown as { badge_id: string; badges: { id: string; slug: string; title: string } | null }[];
    return rows.filter((r) => r.badges).map((r) => {
      const slug = r.badges!.slug ?? "";
      const emoji = Object.entries(BADGE_EMOJI).find(([k]) => slug.includes(k))?.[1] ?? "🏅";
      return { id: r.badges!.id, emoji, label: r.badges!.title };
    });
  });
}

export async function getMastery(): Promise<Mastery[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getMastery", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("skill_mastery").select("skill_id, mastery_score, skills(name, track)").eq("user_id", s.user.id)) as unknown as { skill_id: string; mastery_score: number; skills: { name: string | null; track: string | null } | null }[];
    if (!rows.length) return null;
    // group by track (path) → average mastery
    const byPath = new Map<string, number[]>();
    for (const r of rows) {
      const key = r.skills?.track ?? "General";
      byPath.set(key, [...(byPath.get(key) ?? []), r.mastery_score ?? 0]);
    }
    return [...byPath.entries()].map(([path, arr]) => ({ path: path.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), pct: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }));
  });
}

/* ── my record ────────────────────────────────────────────────────────
 * Everything below was a fixture ("71% accuracy · 12 research · 12 achievements"). Each is now counted
 * from the member's own rows; a member with no history gets zeros, which is the honest answer. */

/** Every pick this member has made, with a % return where one can be known (resolved row, else a live quote). */
type PickReturn = { stance: "buy" | "watch" | "pass"; ret: number | null; at: string };
async function myPickReturns(userId: string): Promise<PickReturn[]> {
  const supa = await userClient();
  const picks = must(await supa.from("fic_club_picks").select("symbol, stance, price_at_pick, resolved_return_pct, created_at").eq("author_id", userId)) as
    { symbol: string; stance: "buy" | "watch" | "pass"; price_at_pick: number | null; resolved_return_pct: number | null; created_at: string }[];
  const open = picks.filter((p) => p.resolved_return_pct === null && p.price_at_pick);
  const quotes = open.length ? await quotesSafe([...new Set(open.map((p) => p.symbol))]) : {};
  return picks.map((p) => {
    let ret: number | null = p.resolved_return_pct !== null ? Number(p.resolved_return_pct) : null;
    if (ret === null && p.price_at_pick) {
      const q = quotes[p.symbol.toUpperCase()];
      if (q) ret = ((q.price - Number(p.price_at_pick)) / Number(p.price_at_pick)) * 100;
    }
    return { stance: p.stance, ret, at: p.created_at };
  });
}

/** Pick accuracy: a buy/watch is "right" when the symbol is up since the pick, a pass when it's down. */
export async function getReputation(): Promise<Reputation | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getReputation", async () => {
    const rows = (await myPickReturns(s.user.id)).filter((r) => r.ret !== null);
    if (!rows.length) return { pickPositivePct: 0, resolvedPicks: 0 };
    const right = rows.filter((r) => (r.stance === "pass" ? r.ret! < 0 : r.ret! > 0)).length;
    return { pickPositivePct: Math.round((right / rows.length) * 100), resolvedPicks: rows.length };
  });
}

/** "PICKS YTD" on Me: the average return of the picks this member opened this calendar year.
 *  `null` (rendered "—") when nothing is priceable — never a stand-in number. */
export async function getMyPicksSummary(): Promise<{ ytdPct: number | null; count: number } | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getMyPicksSummary", async () => {
    const jan1 = new Date(new Date().getFullYear(), 0, 1).getTime();
    const ytd = (await myPickReturns(s.user.id)).filter((r) => new Date(r.at).getTime() >= jan1);
    const priced = ytd.filter((r) => r.ret !== null);
    return { ytdPct: priced.length ? +(priced.reduce((a, r) => a + r.ret!, 0) / priced.length).toFixed(1) : null, count: ytd.length };
  });
}

/** What earned the current belt: lessons, research notes, practice drills, club proposals + votes. */
export async function getPromotion(): Promise<PromotionSummary & { lifetimeXp: number } | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.getPromotion", async () => {
    const supa = await userClient();
    const head = { count: "exact" as const, head: true };
    const [xp, lessons, research, games, proposals, votes] = await Promise.all([
      xpTotals(s.user.id),
      supa.from("lesson_progress").select("id", head).eq("user_id", s.user.id).eq("status", "completed"),
      supa.from("fic_club_research").select("id", head).eq("assignee_id", s.user.id).eq("status", "done"),
      supa.from("game_scores").select("id", head).eq("user_id", s.user.id),
      supa.from("fic_club_proposals").select("id", head).eq("author_id", s.user.id),
      supa.from("fic_club_votes").select("proposal_id", head).eq("user_id", s.user.id),
    ]);
    const lifetime = xp?.lifetime ?? 0;
    return {
      belt: beltAtLevel((await awardedLevels([s.user.id]))[s.user.id] ?? 1), lifetimeXp: lifetime,
      lessons: lessons.count ?? 0,
      research: research.count ?? 0,
      drills: games.count ?? 0,
      clubActions: (proposals.count ?? 0) + (votes.count ?? 0),
    };
  });
}

/** Research notes this member has finished — the number beside "RESEARCH" on Me. */
export async function researchCount(): Promise<number | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.researchCount", async () => {
    const supa = await userClient();
    const { count } = await supa.from("fic_club_research").select("id", { count: "exact", head: true }).eq("assignee_id", s.user.id).eq("status", "done");
    return count ?? 0;
  });
}

/** Achievements = badges actually earned. */
export async function achievementsCount(): Promise<number | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("identity.achievementsCount", async () => {
    const supa = await userClient();
    const { count } = await supa.from("user_badges").select("badge_id", { count: "exact", head: true }).eq("user_id", s.user.id);
    return count ?? 0;
  });
}

/** Specialist badges = the tracks this member has actually mastered most (skill_mastery), top 2. */
export async function specialistBadges(): Promise<string[] | null> {
  const m = await getMastery();
  if (!m) return null;
  return m.filter((x) => x.pct >= 50).sort((a, b) => b.pct - a.pct).slice(0, 2).map((x) => x.path);
}
