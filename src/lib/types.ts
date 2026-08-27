/** Domain types — mirrors the rebuild plan §13 (learning, progress, markets, practice, community, family). */
export type ExplanationLevel = "Explorer" | "Builder" | "Investor" | "Trader";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  level: number;
  levelXp: number;
  levelXpMax: number;
  weekXp: number;
  streakDays: number;
  lessonsDone: number;
  explanationLevel: ExplanationLevel;
  dailyGoalXp: number;
  todayXp: number;
};

export type FamilyMember = { id: string; name: string; xp: number; color: string; isYou?: boolean };
export type Family = {
  name: string;
  inviteCode: string;
  streakDays: number;
  streakWeeks: number;
  members: FamilyMember[];
  weeklyChallenge: { title: string };
  portfolio: { value: number; ytdPct: number };
};

export type Lesson = { id: string; title: string; index: number; status: "done" | "next" | "locked" | "checkpoint" | "challenge"; minutes?: number; subtitle?: string };
export type Unit = { id: string; title: string; lessons: number; blurb: string; kind?: "unit" | "checkpoint" };
export type LearningPath = {
  slug: string;
  title: string;
  lessons: number;
  checkpoints: number;
  units: Unit[];
  hours: number;
  blurb: string;
  progress: number; // 0..100
  status: "done" | "active" | "locked" | "available";
  elective?: boolean;
  nextLesson?: number;
  xp: number;
  concepts: number;
  badges: number;
  lessonList?: Lesson[];
};

export type Question = {
  id: string;
  concept: string;
  lessonId: string;
  prompt: string;
  options: string[];
  answerIdx: number;
  explanation: string;
  xp: number;
};

export type Company = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  series: Record<string, number[]>; // "1D" | "1W" ...
  understand: { q: string; concept?: string }[];
};

export type Holding = { symbol: string; name: string; shares: number; value: number; changePct: number };
export type Portfolio = {
  cash: number;
  totalValue: number;
  dayChange: number;
  dayChangePct: number;
  holdings: Holding[];
  series: number[];
  insight: { text: string; lessonTitle: string; lessonMinutes: number; lessonHref: string };
};

export type IdeaStatus = "DRAFT" | "RESEARCHING" | "DISCUSSING" | "WATCHING" | "ACTIVE";
export type Idea = {
  id: string;
  title: string;
  author: string;
  ago: string;
  status: IdeaStatus;
  summary: string;
  opportunity: string;
  horizon: string;
  companies: { symbol: string; name: string; changePct: number }[];
  risks: string;
  concepts: string[];
  likes: number;
  comments: number;
  saves: number;
};
export type ClubPost =
  | { kind: "idea"; idea: Idea }
  | { kind: "portfolio"; name: string; ytdPct: number; holdings: number; followers: number }
  | { kind: "poll"; author: string; ago: string; question: string; options: { label: string; pct: number }[] };

export type Badge = { id: string; emoji: string; label: string };
export type Mastery = { path: string; pct: number };

/* ── Round 2: the rest of the member surface (spec §3) ─────────────── */
export type LiveSession = {
  id: string; title: string; instructor: string; level: ExplanationLevel | "All"; startsAt: string; // ISO
  minutes: number; status: "live" | "upcoming" | "recorded"; watching?: number; pathSlug?: string; concepts: string[]; blurb: string;
};
export type Flashcard = { id: string; term: string; definition: string; concept: string; pathSlug: string };
export type Game = { id: string; title: string; kind: "recognition" | "decision" | "chart" | "family"; skill: string; level: string; minutes: number; best?: number; blurb: string; emoji: string };
export type ChartDrill = { id: string; symbol: string; series: number[]; reveal: number[]; prompt: string; options: string[]; answerIdx: number; explanation: string; concept: string };
export type Scenario = {
  id: string; title: string; blurb: string; minutes: number; steps: { id: string; text: string; choices: { label: string; next: string | null; outcome?: string; good?: boolean }[] }[];
};
export type NewsItem = { id: string; headline: string; source: string; ago: string; symbols: string[]; whyItMatters: string; concepts: string[]; body: string };
export type WatchItem = { symbol: string; name: string; reason: string; list: "personal" | "family" | "class"; ideaId?: string };
export type DiscoverCategory = { id: string; title: string; blurb: string; emoji: string; symbols: string[]; why: string };
export type Metric = { key: string; label: string; value: string; definition: string; lessonHref: string };
export type Order = { id: string; symbol: string; side: "buy" | "sell"; shares: number; price: number; at: string; thesis?: string; status: "filled" | "pending" };
export type Comment = { id: string; author: string; role?: string; ago: string; text: string; replies?: Comment[]; concept?: string };
export type ModelHolding = { symbol: string; name: string; weightPct: number; changePct: number; thesis: string; addedAgo: string };
export type Proposal = { id: string; kind: "add" | "remove" | "resize"; symbol: string; by: string; ago: string; rationale: string; votesFor: number; votesAgainst: number; status: "open" | "passed" | "rejected" };
export type ModelPortfolio = {
  id: string; name: string; ytdPct: number; benchmarkYtdPct: number; holdings: ModelHolding[]; followers: number; series: number[]; proposals: Proposal[];
  history: { ago: string; text: string }[]; blurb: string;
};
export type Group = { id: string; name: string; kind: "family" | "class" | "topic" | "org"; members: number; blurb: string; emoji: string; pinned: string[]; joined: boolean };
export type Challenge = { id: string; title: string; kind: "individual" | "family" | "class"; blurb: string; steps: string[]; xp: number; due: string; progress: number; participants: number };
export type Member = { id: string; name: string; role: string; level: ExplanationLevel; bio: string; badges: string[]; favorites: string[]; ideas: number; comments: number; joined: string; ageBadge?: string };
export type FamilyLearner = { id: string; name: string; role: "parent" | "child" | "teen"; level: ExplanationLevel; pathTitle: string; pathProgress: number; streak: number; weekXp: number; needs: string[]; tasks: { title: string; done: boolean }[]; lastActive: string; color: string };
export type Notification = { id: string; kind: "lesson" | "family" | "club" | "live" | "system"; title: string; body: string; ago: string; href: string; read: boolean };
export type Faq = { q: string; a: string };

/* ── Round 3: the Investing Club object layer (Product Shift v3, §8–§12, §19) ── */
/** A Household is an account relationship; an Investing Club is the social object. Never render a household directly. */
export type ClubKind = "family" | "friends" | "mixed";
export type ClubMember = { id: string; name: string; initial: string; color: string; role: "founder" | "admin" | "member" | "child"; level: ExplanationLevel; isYou?: boolean; voteGated?: boolean; gateReason?: string };
export type Club = {
  id: string; name: string; shortName: string; kind: ClubKind; privacy: "private" | "public"; est: string; members: ClubMember[];
  inviteCode: string; inviteLink: string; rules: { votes: "majority" | "unanimous" | "founder"; kidsCanVote: boolean; maxWeightPct: number; weeklyPrompt: string };
  streakWeeks: number; investingNight: { when: string; topic: string };
};
export type PickStance = "buy" | "watch" | "pass";
export type Pick = {
  id: string; clubId: string | "public"; authorId: string; author: string; ago: string; symbol: string; name: string; stance: PickStance; reason: string;
  horizon: "1y" | "3y" | "5y+"; confidence: 1 | 2 | 3 | 4 | 5; priceAtPick: number; agree: number; notSure: number; replies: Comment[]; visibility: "club" | "public";
};
export type ClubProposal = {
  id: string; clubId: string; kind: "add" | "remove" | "resize"; symbol: string; name: string; fromWeightPct: number; toWeightPct: number; practiceDollars: number;
  by: string; byId: string; postedAgo: string; endsIn: string; rationale: string; evidence: { label: string; href: string }[]; sinceBuyPct?: number;
  conceptGate?: { concept: string; minutes: number; href: string }; votes: { memberId: string; vote: "for" | "against" | null }[]; status: "open" | "passed" | "rejected";
};
export type ClubHolding = { symbol: string; name: string; weightPct: number; returnPct: number; origin: string; proposalId?: string };
export type JournalEntry = { date: string; title: string; believed?: string; wrongIf?: string; review?: string; learned?: string };
export type ClubPortfolio = { clubId: string; name: string; value: number; ytdPct: number; benchmarkYtdPct: number; holdings: ClubHolding[]; journal: JournalEntry[]; series: number[] };
export type ResearchAssignment = { id: string; symbol: string; name: string; assigneeId: string; assignee: string; due: string; status: "open" | "done"; notes?: string; reason: string };
export type ClubActivity = { id: string; actorId: string; actor: string; ago: string; kind: "pick" | "comment" | "research" | "lesson" | "vote" | "add"; text: string; href: string; quote?: string };
export type PublicClub = { id: string; name: string; emoji: string; members: number; blurb: string; portfolioYtdPct?: number; activeIdeas?: number; moderated?: boolean };
export type Community = {
  trendingIdeas: { id: string; title: string; author: string; status: string; following: number; symbols: string[] }[];
  popularPicks: { symbol: string; stance: PickStance; quote: string; agree: number }[];
  publicClubs: PublicClub[];
  mostResearched: { symbol: string; count: number }[];
  peopleToFollow: { id: string; name: string; initial: string }[];
  live?: { id: string; title: string; inRoom: number };
  publicPicks: Pick[];
};
export type ChildHome = {
  name: string; level: ExplanationLevel; streakDays: number;
  familyRequest?: { fromId: string; from: string; symbol: string; name: string; text: string };
  nextLesson: { path: string; title: string; minutes: number; href: string };
  practice: { value: number; changePct: number; note: string };
  familyVote?: { proposalId: string; text: string; gated: boolean };
  newBadge?: { emoji: string; label: string; sub: string };
  investingNight: { when: string; text: string };
};
