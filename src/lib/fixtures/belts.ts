import type { XpEvent, Reputation, MemberIdentity, ClubXpGoal, XpLeaderboard, PromotionSummary } from "@/lib/types";
import { BELTS } from "@/lib/belts";

/** Kway: 2,640 lifetime XP → Purple Belt, 560 XP to Black (canvas v9/v10). */
export const identities: MemberIdentity[] = [
  { memberId: "kway", name: "Kway", initial: "K", color: "bg-green-3", lifetimeXp: 2640, weekXp: 430 },
  { memberId: "dad", name: "Dad", initial: "D", color: "bg-purple", lifetimeXp: 910, weekXp: 80 },
  { memberId: "andwele", name: "Andwele", initial: "A", color: "bg-green-2", lifetimeXp: 830, weekXp: 150 },
  { memberId: "mom", name: "Mom", initial: "M", color: "bg-coral", lifetimeXp: 260, weekXp: 95 },
  { memberId: "arielle", name: "Arielle", initial: "A", color: "bg-gold", lifetimeXp: 310, weekXp: 240 },
];
export const identityOf = (memberId: string) => identities.find((i) => i.memberId === memberId);

export const recentXp: XpEvent[] = [
  { id: "x1", emoji: "📚", text: "Lesson: Why prices move", xp: 20, ago: "today", kind: "learn" },
  { id: "x2", emoji: "🔍", text: "Costco research for the club", xp: 15, ago: "yesterday", kind: "research" },
  { id: "x3", emoji: "📅", text: "Family Investing Night", xp: 10, ago: "Thu", kind: "family" },
];
export const reputation: Reputation = { pickPositivePct: 71, resolvedPicks: 14 };
export const specialistBadges = ["Technology", "Long-Term"];
export const achievementsCount = 12;

export const clubXpGoal: ClubXpGoal = { current: 340, goal: 500, window: "THIS WEEK'S GOAL", milestone: "club field trip badge" };

/** Club feed XP annotations by activity id (from fixtures/club.ts). */
export const activityXp: Record<string, number> = { a1: 8, a2: 15, a4: 12, a5: 20 };

export const xpLeaderboard: XpLeaderboard = {
  windows: ["7 days", "30 days", "All-time"],
  scopes: ["Family", "Class"],
  rows: [
    { rank: 1, memberId: "arielle", name: "Arielle", initial: "A", color: "bg-gold", lifetimeXp: 310, deltaXp: 240 },
    { rank: 2, memberId: "kway", name: "Kway (you)", initial: "K", color: "bg-green-3", lifetimeXp: 980, deltaXp: 185, isYou: true },
    { rank: 3, memberId: "andwele", name: "Andwele", initial: "A", color: "bg-green-2", lifetimeXp: 520, deltaXp: 150 },
    { rank: 4, memberId: "mom", name: "Mom", initial: "M", color: "bg-coral", lifetimeXp: 260, deltaXp: 95 },
    { rank: 5, memberId: "dad", name: "Dad", initial: "D", color: "bg-purple", lifetimeXp: 910, deltaXp: 80 },
  ],
  callout: "A White Belt leading the XP board is the system working — Arielle out-learned everyone this week. Pick accuracy is a different board.",
  otherBoards: [
    { emoji: "📈", label: "Pick performance", href: "/club/leaderboards" },
    { emoji: "🎯", label: "Practice portfolio", href: "/club/leaderboards?board=practice" },
    { emoji: "🔍", label: "Research contribution", href: "/club/leaderboards?board=research" },
  ],
};

export const promotion: PromotionSummary = { belt: BELTS[4], lessons: 46, research: 12, drills: 31, clubActions: 9 };
