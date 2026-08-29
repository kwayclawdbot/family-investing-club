/**
 * Session-aware data facade. Same names as `@/lib/data.ts`; each call reads Supabase when the
 * visitor is signed in (RLS-scoped) and falls back to the fixture when signed out, when a table
 * hasn't been migrated yet, or on any error. Screens can switch imports one at a time.
 */
import "server-only";
// Superset of the client-safe fixture/market layer: everything not overridden below falls through.
export * from "@/lib/data";
import * as fxData from "@/lib/data";
import * as fx from "@/lib/fixtures";
import * as fc from "@/lib/fixtures/club";
import * as fb from "@/lib/fixtures/belts";
import * as fw from "@/lib/fixtures/workspace";
import * as fv from "@/lib/fixtures/verified";
import * as r2 from "@/lib/fixtures/round2";
import * as live from "@/lib/live";
import { clubConsensus, ficConsensus } from "@/lib/live/admin";
import { clubContext } from "@/lib/live/club";
import { dataMode, strictLive } from "@/lib/live/mode";
import { getSession } from "@/lib/live/session";
import type { Family, HomePulse, LeaderRow, Leaderboards, MyPortfolio, PromotionSummary, XpLeaderboard } from "@/lib/types";

type Promotion = PromotionSummary & { lifetimeXp?: number };

/**
 * Live-first read. Signed in → the live reader; a `null` there is a LIVE MISS (empty table, RLS,
 * or an unported domain) and is logged in every environment so an outage is never invisible.
 * With FIC_STRICT_LIVE=1 a miss throws (used by `npm run smoke:live`); otherwise the fixture
 * still renders until that domain is ported (see docs/BACKEND-CUTOVER-PLAN.md).
 */
async function pick<T>(liveFn: () => Promise<T | null | undefined>, fallback: () => T | Promise<T>): Promise<T> {
  if ((await dataMode()) === "live") {
    const v = await liveFn();
    if (v !== null && v !== undefined) return v;
    const label = fallback.name || liveFn.name || "anonymous";
    if (strictLive()) throw new Error(`[live-miss] ${label}`);
    if (!missed.has(label)) { missed.add(label); console.warn(`[live-miss] ${label}: live reader returned null — fixture shown`); }
  }
  return fallback();
}
const missed = new Set<string>();

/* identity */
export const getUser = () => pick(live.getUser, () => fx.user);
export const getIdentities = () => pick(live.getIdentities, () => fb.identities);
export const getRecentXp = () => pick(live.getRecentXp, () => fb.recentXp);
export const getBadges = () => pick(live.getBadges, () => fx.badges);
export const getMastery = () => pick(live.getMastery, () => fx.mastery);
export async function getFamily(): Promise<Family> {
  return pick(async () => {
    const club = await live.getClub();
    if (!club) return null;
    const ids = (await live.getIdentities()) ?? [];
    return { name: club.name, inviteCode: club.inviteCode, streakDays: 0, streakWeeks: club.streakWeeks, members: club.members.map((m) => ({ id: m.id, name: m.name, xp: ids.find((i) => i.memberId === m.id)?.weekXp ?? 0, color: m.color, isYou: m.isYou })), weeklyChallenge: fx.family.weeklyChallenge, portfolio: { value: (await live.getClubPortfolio())?.value ?? fx.family.portfolio.value, ytdPct: (await live.getClubPortfolio())?.ytdPct ?? fx.family.portfolio.ytdPct } };
  }, () => fx.family);
}

/* my record — pick accuracy, belt evidence, badge counts (was all fixture) */
export const getReputation = () => pick(live.getReputation, () => fxData.getReputation());
export const getPromotion = () => pick<Promotion>(live.getPromotion, () => fxData.getPromotion());
export const getSpecialistBadges = () => pick(live.specialistBadges, () => fb.specialistBadges);
export const getAchievementsCount = () => pick(live.achievementsCount, () => fb.achievementsCount);
export const getResearchCount = () => pick(live.researchCount, () => fb.reputation.resolvedPicks);
export const getMyPicksSummary = () => pick(live.getMyPicksSummary, () => ({ ytdPct: fv.myPortfolio.ytdPct ?? null, count: 0 }));

/* club */
export const getClub = () => pick(live.getClub, () => fc.club);
export const getPicks = () => pick(live.getPicks, () => fc.picks);
export const getPick = (id: string) => pick(() => live.getPick(id), () => fxData.getPick(id));
export const getProposals = () => pick(live.getProposals, () => fc.proposals);
export const getProposal = (id: string) => pick(() => live.getProposal(id), () => fxData.getProposal(id));
export const getClubPortfolio = () => pick(live.getClubPortfolio, () => fc.clubPortfolio);
export const getResearch = () => pick(live.getResearch, () => fc.research);
export const getClubActivity = () => pick(live.getClubActivity, () => fc.activity);
export const getClubOverview = () => pick(live.getClubOverview, () => fw.clubOverview);
export const getPortfolioTab = () => pick(live.getPortfolioTab, () => fw.portfolioTab);
export const getMemberCards = () => pick(live.getMemberCards, () => fw.memberCards);
export const getChildHome = () => pick(live.getChildHome, () => fc.childHome);

export async function getHomePulse(): Promise<HomePulse> {
  return pick(async () => {
    const [club, overview, ids, s] = await Promise.all([live.getClub(), live.getClubOverview(), live.getIdentities(), getSession()]);
    if (!club || !overview || !s) return null;
    const me = ids?.find((i) => i.memberId === s.user.id);
    const base = fw.homePulse;
    const hour = new Date().getHours();
    const name = me?.name ?? base.greeting.replace(/^Good \w+, /, "");
    const rank = overview.topInvestors.findIndex((t) => t.memberId === s.user.id);
    return {
      greeting: `Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${name}`,
      me: { ...base.me, note: "practice + verified" },
      club: { ...base.club, value: overview.value, ytdPct: overview.ytdPct },
      ranges: base.ranges,
      tiles: { bestPick: overview.metrics.bestPick ?? { symbol: "—", pct: 0 }, clubRank: { rank: rank >= 0 ? rank + 1 : overview.topInvestors.length + 1, of: club.members.length }, xp: me?.lifetimeXp ?? 0 },
      clubSnapshot: { name: club.shortName, members: club.members.length, value: overview.value, ytdPct: overview.ytdPct, verified: `${overview.metrics.verified.connected} of ${overview.metrics.verified.adults} adults verified` },
      decision: overview.activeDecision ? { proposalId: overview.activeDecision.proposalId, text: `Club is deciding on ${overview.activeDecision.title}`, voted: overview.activeDecision.voted, eligible: overview.activeDecision.eligible, hoursLeft: overview.activeDecision.hoursLeft } : base.decision,
      stream: overview.happened.slice(0, 3).map((h) => ({ id: h.id, actorId: h.actorId, actor: h.actor, text: h.text, ago: h.ago, pct: h.pct, href: "/club" })),
      continueCard: await (async () => { const c = await live.getContinueLesson(); return c ? { title: `Continue: ${c.title}`, sub: `${c.minutes} min · ${c.pathTitle}`, href: `/lesson/${c.lessonId}` } : base.continueCard; })(),
    };
  }, () => fw.homePulse);
}

/* lists, practice, learning, news, community, notifications */
export const getWatchlist = () => pick(live.getWatchlist, () => r2.watchlist);
export const getPortfolio = () => pick(live.getPortfolio, () => fx.portfolio);
export const getOrders = () => pick(live.getOrders, () => r2.orders);
export const getPaths = () => pick(live.getPaths, () => fx.paths);
export const getPath = (slug: string) => pick(() => live.getPath(slug), () => fxData.getPath(slug));
export const getContinueLesson = () => pick(live.getContinueLesson, () => fx.continueLesson);
export const getFlashcards = () => pick(live.getFlashcards, () => r2.flashcards);
export const getGames = () => pick(live.getGames, () => fxData.getGames());
export const getGame = (id: string) => pick(() => live.getGame(id), () => fxData.getGame(id));
export const getLiveSessions = () => pick(live.getLiveSessions, () => r2.liveSessions);
export const getLiveSession = (id: string) => pick(() => live.getLiveSession(id), () => fxData.getLiveSession(id));
export const getNews = () => pick(live.getNews, () => r2.news);
export const getNewsItem = (id: string) => pick(() => live.getNewsItem(id), () => fxData.getNewsItem(id));
export const getCommunityPosts = () => pick(live.getCommunityPosts, () => fw.communityPosts);
export const getCommunityChats = () => pick(live.getCommunityChats, () => fw.communityChats);
export const getCommunityClubs = () => pick(live.getCommunityClubs, () => fw.communityClubs);
export const getNotifications = () => pick(live.getNotifications, () => r2.notifications);

/* boards */
export async function getXpLeaderboard(): Promise<XpLeaderboard> {
  return pick(async () => {
    const [ids, s] = await Promise.all([live.getIdentities(), getSession()]);
    if (!ids || !s) return null;
    const rows = [...ids].sort((a, b) => b.weekXp - a.weekXp).map((i, n) => ({ rank: n + 1, memberId: i.memberId, name: i.memberId === s.user.id ? `${i.name} (you)` : i.name, initial: i.initial, color: i.color, lifetimeXp: i.lifetimeXp, deltaXp: i.weekXp, isYou: i.memberId === s.user.id }));
    return { ...fb.xpLeaderboard, rows, callout: rows[0] ? `${rows[0].name} leads this week on participation — XP is separate from investment performance.` : fb.xpLeaderboard.callout };
  }, () => fb.xpLeaderboard);
}
export async function getLeaderboards(): Promise<Leaderboards> {
  return pick(async () => {
    const ov = await live.getClubOverview();
    if (!ov || !ov.topInvestors.length) return null;
    const rows: LeaderRow[] = ov.topInvestors.map((t) => ({ rank: t.rank, memberId: t.memberId, name: t.name, basis: t.verified ? "VERIFIED ✓" : "PICK", valuePct: t.ytdPct }));
    return { ...fv.leaderboards, rows };
  }, () => fv.leaderboards);
}

/* consensus (admin aggregates, scoped to the member's own club) */
export async function getClubConsensus(symbol: string) {
  return pick(async () => {
    const ctx = await clubContext();
    if (!ctx) return null;
    const port = await live.getClubPortfolio();
    const target = port?.holdings.find((h) => h.symbol === symbol.toUpperCase())?.weightPct ?? null;
    return clubConsensus(ctx.club.id, symbol, target);
  }, () => fxData.getClubConsensus(symbol));
}
export const getFicConsensus = (symbol: string) => pick(() => ficConsensus(symbol), () => fxData.getFicConsensus(symbol));

/* brokerage link metadata (holdings stay fixture until an aggregator is wired) */
export async function getMyPortfolio(): Promise<MyPortfolio> {
  return pick(async () => {
    const s = await getSession();
    if (!s) return null;
    const { userClient } = await import("@/lib/live/supa");
    const supa = await userClient();
    const { data } = await supa.from("fic_brokerage_links").select("provider, account_label, sharing, public_badge, synced_at").eq("user_id", s.user.id).maybeSingle();
    if (!data) return { ...fv.myPortfolio, brokerage: null, sharing: { club: "private", publicBadge: false } };
    const d = data as { provider: string; account_label: string | null; sharing: MyPortfolio["sharing"]["club"]; public_badge: boolean; synced_at: string | null };
    return { ...fv.myPortfolio, brokerage: { id: d.provider, name: d.provider, last4: (d.account_label ?? "").slice(-4), syncedAgo: d.synced_at ? new Date(d.synced_at).toLocaleTimeString() : "—", connected: true }, sharing: { club: d.sharing, publicBadge: d.public_badge } };
  }, () => fv.myPortfolio);
}

export { dataMode };
