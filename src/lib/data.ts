/**
 * Data access layer. Today every function resolves from fixtures; each is the
 * seam where the FTA Supabase engine (see docs/KEEP-AND-REBUILD.md) plugs in.
 * Keep the signatures — screens only import from here.
 */
import * as fx from "@/lib/fixtures";
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
