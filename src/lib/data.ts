/**
 * Data access layer. Today every function resolves from fixtures; each is the
 * seam where the FTA Supabase engine (see docs/KEEP-AND-REBUILD.md) plugs in.
 * Keep the signatures — screens only import from here.
 */
import * as fx from "@/lib/fixtures";
import * as r2 from "@/lib/fixtures/round2";
import * as c from "@/lib/fixtures/club";
import * as v from "@/lib/fixtures/verified";
import * as bl from "@/lib/fixtures/belts";
import { GAMES, gameById } from "@/lib/content/games";
import * as ws from "@/lib/fixtures/workspace";
import type { Company, Idea, LearningPath, Metric, NewsItem, Portfolio } from "@/lib/types";
import * as mkt from "@/lib/market";

export async function getUser() { return fx.user; }
export async function getFamily() { return fx.family; }
export async function getLeague() { return fx.league; }
export async function getContinueLesson() { return fx.continueLesson; }
export async function getPaths(): Promise<LearningPath[]> { return fx.paths; }
export async function getPath(slug: string): Promise<LearningPath | undefined> { return fx.paths.find((p) => p.slug === slug); }
export async function getLessonQuestions(lessonId: string) { return fx.questions.filter((q) => q.lessonId === lessonId); }
/* ── Markets: Polygon when POLYGON_API_KEY is set, fixtures otherwise (see src/lib/market) ── */
const fixtureCompany = (symbol: string) => fx.companies.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
const withSample = (c: Company): Company => ({ ...c, freshness: c.freshness ?? "sample" });

/** Quotes for a set of symbols (default: the tracked universe). One cached grouped-daily call covers
 *  every symbol, so passing a longer list costs nothing extra. Fixture list when offline. */
export async function getCompanies(symbols?: string[]): Promise<Company[]> {
  const want = symbols?.length ? [...new Set(symbols.map((s) => s.toUpperCase()))] : undefined;
  const live = mkt.hasPolygon() ? await mkt.companies(want) : null;
  if (live && live.length) return live;
  const f = fx.companies.map(withSample);
  return want ? f.filter((c) => want.includes(c.symbol.toUpperCase())) : f;
}
export async function getCompany(symbol: string): Promise<Company | undefined> {
  const live = mkt.hasPolygon() ? await mkt.company(symbol) : null;
  if (live) return live;
  const f = fixtureCompany(symbol);
  return f ? withSample(f) : undefined;
}
export async function searchCompanies(q: string): Promise<Company[]> {
  const s = q.trim().toLowerCase();
  const universe = await getCompanies();
  if (!s) return universe;
  const local = universe.filter((c) => c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
  const hits = mkt.hasPolygon() ? await mkt.searchSymbols(s) : null;
  if (!hits) return local;
  const seen = new Set(local.map((c) => c.symbol));
  const extra = hits.filter((h) => !seen.has(h.symbol)).slice(0, 6);
  const quotes = extra.length ? await mkt.getQuotes(extra.map((h) => h.symbol), { maxWait: 4_000 }) : {};
  const live: Company[] = extra.flatMap((h) => {
    const q = quotes[h.symbol];
    return q ? [{ symbol: h.symbol, name: h.name, price: q.price, change: q.change, changePct: q.changePct, series: { "1D": [q.prevClose, q.price] }, understand: [{ q: `How does ${h.name} make money?` }, { q: `Is ${h.name} expensive?`, concept: "P/E RATIO" }], asOf: q.asOf, freshness: q.freshness }] : [];
  });
  return [...local, ...live];
}
/** Chart closes for one range; fixture series when offline. */
export async function getSeries(symbol: string, range: mkt.Range): Promise<{ closes: number[]; freshness: "delayed" | "eod" | "sample" }> {
  const live = mkt.hasPolygon() ? await mkt.seriesWithTimestamps(symbol, range) : null;
  if (live && live.closes.length > 1) return { closes: live.closes, freshness: live.freshness };
  const f = fixtureCompany(symbol);
  return { closes: f?.series[range] ?? f?.series["1M"] ?? [], freshness: "sample" };
}
/** % return since a timestamped pick, from the live price (null when offline). */
export async function getSincePick(symbol: string, priceAtPick: number) {
  return mkt.hasPolygon() ? mkt.sincePick(symbol, priceAtPick) : null;
}
export async function getCompanyLogo(symbol: string): Promise<string | null> {
  return mkt.hasPolygon() ? mkt.logo(symbol) : null;
}
export async function getLiveQuote(symbol: string) {
  return mkt.hasPolygon() ? mkt.getQuote(symbol) : null;
}
/** Practice portfolio: holding values/day change recomputed from live quotes when available. */
export async function getPortfolio(): Promise<Portfolio> {
  const base = fx.portfolio;
  if (!mkt.hasPolygon()) return base;
  const quotes = await mkt.getQuotes(base.holdings.map((h) => h.symbol), { maxWait: 10_000 });
  if (Object.values(quotes).every((q) => q === null)) return base;
  let fixtureSum = 0, liveSum = 0, dayChange = 0;
  const holdings = base.holdings.map((h) => {
    fixtureSum += h.value;
    const q = quotes[h.symbol.toUpperCase()];
    if (!q) { liveSum += h.value; return h; }
    const value = +(h.shares * q.price).toFixed(2);
    liveSum += value; dayChange += h.shares * q.change;
    return { ...h, value, changePct: q.changePct, price: q.price, asOf: q.asOf, freshness: q.freshness };
  });
  const totalValue = +(base.totalValue + (liveSum - fixtureSum)).toFixed(2);
  const prevTotal = totalValue - dayChange;
  return { ...base, holdings, totalValue, dayChange: +dayChange.toFixed(2), dayChangePct: prevTotal > 0 ? +((dayChange / prevTotal) * 100).toFixed(2) : base.dayChangePct };
}
export async function getClubFeed() { return fx.clubFeed; }
export async function getIdea(id: string): Promise<Idea | undefined> { return fx.ideas.find((i) => i.id === id); }
export async function getBadges() { return fx.badges; }
export async function getMastery() { return fx.mastery; }
export const kai = { prompts: fx.kaiPrompts, sample: fx.kaiSample };
export const onboardingOptions = fx.onboarding;

/* ── Round 2 surfaces ───────────────────────────────────────────────── */
export async function getLiveSessions() { return r2.liveSessions; }
export async function getLiveSession(id: string) { return r2.liveSessions.find((s) => s.id === id); }
export async function getFlashcards() { return r2.flashcards; }
export async function getGames() { return GAMES; }
export async function getGame(id: string) { return gameById(id); }
export const termPairs = r2.termPairs;
export async function getChartDrills() { return r2.chartDrills; }
export async function getScenarios() { return r2.scenarios; }
export async function getScenario(id: string) { return r2.scenarios.find((s) => s.id === id); }
/** News for the companies you follow (watchlist) — Polygon when available, fixture stories otherwise. */
export async function getNews(): Promise<NewsItem[]> {
  const symbols = [...new Set(r2.watchlist.map((w) => w.symbol))];
  const live = mkt.hasPolygon() ? await mkt.newsFor(symbols, 4) : null;
  return live && live.length ? live : r2.news;
}
export async function getNewsItem(id: string): Promise<NewsItem | undefined> {
  const fixture = r2.news.find((n) => n.id === id);
  if (fixture) return fixture;
  const live = mkt.hasPolygon() ? await mkt.newsItem(id) : null;
  return live ?? undefined;
}
export async function getWatchlist() { return r2.watchlist; }
export async function getDiscover() { return r2.discover; }
/** Key metrics: live from Polygon (same definitions + lesson links), fixture otherwise. */
export async function getMetrics(symbol: string): Promise<Metric[]> {
  const defs = r2.metricsFor(symbol.toUpperCase());
  const live = mkt.hasPolygon() ? await mkt.metrics(symbol, defs) : null;
  return live ?? defs;
}
export async function getOrders() { return r2.orders; }
export async function getIdeaComments(ideaId: string) { return r2.ideaComments[ideaId] ?? []; }
export async function getModelPortfolios() { return r2.modelPortfolios; }
export async function getModelPortfolio(id: string) { return r2.modelPortfolios.find((p) => p.id === id); }
export async function getGroups() { return r2.groups; }
export async function getGroup(id: string) { return r2.groups.find((g) => g.id === id); }
export async function getChallenges() { return r2.challenges; }
export async function getChallenge(id: string) { return r2.challenges.find((c) => c.id === id); }
export async function getMembers() { return r2.members; }
export async function getMember(id: string) { return r2.members.find((m) => m.id === id); }
export async function getLearners() { return r2.learners; }
export async function getLearner(id: string) { return r2.learners.find((l) => l.id === id); }
export async function getNotifications() { return r2.notifications; }
export async function getFaqs() { return r2.faqs; }
export const referral = r2.referral;
export const subscription = r2.subscription;

/* ── Round 3: Investing Club layer ──────────────────────────────────── */
export async function getClub() { return c.club; }
export const clubVisibleMembers = c.visibleMembers;
export async function getClubMember(id: string) { return c.club.members.find((m) => m.id === id); }
export async function getPicks() { return c.picks; }
export async function getPick(id: string) { return c.picks.find((p) => p.id === id) ?? c.community.publicPicks.find((p) => p.id === id); }
export async function getProposals() { return c.proposals; }
export async function getProposal(id: string) { return c.proposals.find((p) => p.id === id); }
export async function getClubPortfolio() { return c.clubPortfolio; }
export async function getResearch() { return c.research; }
export async function getClubActivity() { return c.activity; }
export async function getCommunity() { return c.community; }
export async function getChildHome() { return c.childHome; }
export function clubWatchers(symbol: string) { return c.clubWatching[symbol.toUpperCase()] ?? []; }
export const costcoQuote = c.costcoQuote;

/* ── Round 4: verified collective investing (canvas v7) ─────────────── */
export const brokerages = v.brokerages;
export async function getMyPortfolio() { return v.myPortfolio; }
export async function getClubConsensus(symbol: string) { return v.clubConsensus[symbol.toUpperCase()]; }
export async function getFicConsensus(symbol: string) { return v.ficConsensus[symbol.toUpperCase()]; }
export async function getDiscoverSignals() { return v.discoverSignals; }
export async function getVerifiedExposure() { return v.verifiedExposure; }
export async function getLeaderboards() { return v.leaderboards; }

/* ── Round 5: XP + Belt rank system ─────────────────────────────────── */
export { BELTS, eligibleBeltFor, beltAtLevel, beltStatus, nextBelt } from "@/lib/belts";
export const identityOf = bl.identityOf;
export async function getIdentities() { return bl.identities; }
export async function getRecentXp() { return bl.recentXp; }
export async function getReputation() { return bl.reputation; }
export const specialistBadges = bl.specialistBadges;
export const achievementsCount = bl.achievementsCount;
export async function getClubXpGoal() { return bl.clubXpGoal; }
export const activityXp = bl.activityXp;
export async function getXpLeaderboard() { return bl.xpLeaderboard; }
export async function getPromotion() { return bl.promotion; }

/* ── Round 6: collective-performance workspace · Home pulse · Community ── */
export async function getClubOverview() { return ws.clubOverview; }
export async function getPortfolioTab() { return ws.portfolioTab; }
export async function getMemberCards() { return ws.memberCards; }
export async function getHomePulse() { return ws.homePulse; }
export async function getCommunityPosts() { return ws.communityPosts; }
export async function getCommunityChats() { return ws.communityChats; }
export async function getCommunityClubs() { return ws.communityClubs; }
export async function getCommunityLive() { return ws.communityLive; }
