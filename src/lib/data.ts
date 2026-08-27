/**
 * Data access layer. Today every function resolves from fixtures; each is the
 * seam where the FTA Supabase engine (see docs/KEEP-AND-REBUILD.md) plugs in.
 * Keep the signatures — screens only import from here.
 */
import * as fx from "@/lib/fixtures";
import * as r2 from "@/lib/fixtures/round2";
import * as c from "@/lib/fixtures/club";
import type { Company, Idea, LearningPath } from "@/lib/types";

export async function getUser() { return fx.user; }
export async function getFamily() { return fx.family; }
export async function getLeague() { return fx.league; }
export async function getContinueLesson() { return fx.continueLesson; }
export async function getPaths(): Promise<LearningPath[]> { return fx.paths; }
export async function getPath(slug: string): Promise<LearningPath | undefined> { return fx.paths.find((p) => p.slug === slug); }
export async function getLessonQuestions(lessonId: string) { return fx.questions.filter((q) => q.lessonId === lessonId); }
export async function getCompanies(): Promise<Company[]> { return fx.companies; }
export async function getCompany(symbol: string): Promise<Company | undefined> { return fx.companies.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase()); }
export async function searchCompanies(q: string): Promise<Company[]> {
  const s = q.trim().toLowerCase();
  if (!s) return fx.companies;
  return fx.companies.filter((c) => c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
}
export async function getPortfolio() { return fx.portfolio; }
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
export async function getGames() { return r2.games; }
export async function getGame(id: string) { return r2.games.find((g) => g.id === id); }
export const termPairs = r2.termPairs;
export async function getChartDrills() { return r2.chartDrills; }
export async function getScenarios() { return r2.scenarios; }
export async function getScenario(id: string) { return r2.scenarios.find((s) => s.id === id); }
export async function getNews() { return r2.news; }
export async function getNewsItem(id: string) { return r2.news.find((n) => n.id === id); }
export async function getWatchlist() { return r2.watchlist; }
export async function getDiscover() { return r2.discover; }
export async function getMetrics(symbol: string) { return r2.metricsFor(symbol.toUpperCase()); }
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
