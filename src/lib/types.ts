/** Domain types — mirrors the rebuild plan §13 (learning, progress, markets, practice, community, family). */
export type ExplanationLevel = "Explorer" | "Builder" | "Investor" | "Trader";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  /** XP level (1-7). What their participation has UNLOCKED — not the belt they hold. */
  level: number;
  /** Highest belt test PASSED. This is the belt they wear. 1 = the starting belt. */
  awardedLevel: number;
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
  /** Raw SIC description from the ticker details feed; map with `sectorOf` for a friendly label. */
  sector?: string | null;
  price: number;
  change: number;
  changePct: number;
  series: Record<string, number[]>; // "1D" | "1W" ...
  understand: { q: string; concept?: string }[];
  /** Live-data extras (Polygon); absent on fixtures. */
  about?: string;
  logoUrl?: string;
  marketCap?: number;
  asOf?: string;
  freshness?: "delayed" | "eod" | "sample";
};

export type Holding = { symbol: string; name: string; shares: number; value: number; changePct: number; price?: number; asOf?: string; freshness?: "delayed" | "eod" | "sample" };
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
export type NewsItem = { id: string; headline: string; source: string; ago: string; symbols: string[]; whyItMatters: string; concepts: string[]; body: string; url?: string; publishedAt?: string; imageUrl?: string };
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
export type ClubHolding = { symbol: string; name: string; weightPct: number; returnPct: number; sinceAddPct?: number | null; addedAt?: string; origin: string; proposalId?: string };
export type JournalEntry = { date: string; title: string; believed?: string; wrongIf?: string; review?: string; learned?: string };
export type ClubPortfolio = { clubId: string; name: string; value: number; stake?: number; ytdPct: number; benchmarkYtdPct: number; holdings: ClubHolding[]; journal: JournalEntry[]; series: number[] };
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

/* ── Round 4: verified collective investing (canvas v7) ─────────────── */
/** Badge language is locked: "Brokerage Connected ✓" / "Verified Owner ✓" / "Verified Holding ✓". Never "Verified Investor". */
export type SharingLevel = "private" | "positions" | "allocation" | "full";
export type Brokerage = { id: string; name: string; last4: string; syncedAgo: string; connected: boolean };
export type RealHolding = { symbol: string; name: string; weightPct: number; bucket: "ETFs" | "Tech" | "Consumer" | "Energy" | "Cash" | "Other" };
export type MyPortfolio = {
  brokerage: Brokerage | null; value: number; ytdPct: number; holdings: RealHolding[];
  allocation: { label: string; pct: number; color: string }[];
  sharing: { club: SharingLevel; publicBadge: boolean };
  overlap: { symbol: string; realPct: number; modelPct: number; lessonHref: string; lessonLabel: string; minutes: number };
};
export type ConsensusVote = { memberId: string; stance: PickStance; verified?: boolean };
export type ClubConsensus = {
  symbol: string; confidencePct: number; buy: number; watch: number; pass: number; verifiedOwners: number; modelTargetPct: number | null; verifiedExposurePct: number | null;
  why: string; thesis: string; voters: string[]; totalPicks: number;
};
export type FicConsensus = { symbol: string; picks: number; buyPct: number; watchPct: number; passPct: number; verifiedOwners: number };
export type DiscoverSignal = { symbol: string; name: string; line: string };
export type DiscoverSignals = {
  familiesLikeYours: DiscoverSignal[]; mostResearched: DiscoverSignal[]; mostOwnedVerified: string[]; mostDiscussed: string[];
  trendingParents: { text: string; href: string };
};
export type ExposureRow = { symbol: string; name: string; ownersOf: string; actualPct: number; modelPct: number | null; warn?: boolean };
export type VerifiedExposure = { connectedAdults: number; totalAdults: number; rows: ExposureRow[]; mismatch: { text: string; lessonLabel: string; minutes: number; lessonHref: string } };
export type LeaderRow = { rank: number; memberId: string; name: string; ageLabel?: string; basis: "PRACTICE" | "PICK" | "VERIFIED ✓"; valuePct: number };
export type Leaderboards = {
  boards: { id: string; label: string }[];
  window: string; rows: LeaderRow[]; footnote: string;
  others: { emoji: string; label: string; leader: string }[];
};

/* ── Round 5: XP + Belt rank system (canvas v8) ─────────────────────── */
/** Five identity systems, kept separate: Belt (lifetime XP & participation) · Reputation (resolved pick accuracy) ·
 *  Specialist badges (domain strength) · Verification (ownership, not skill) · Achievements (milestones).
 *  XP never comes from trade count, account size, risk or short-term returns. */
export type BeltColor = "white" | "yellow" | "green" | "blue" | "black";
export type Belt = { level: 1 | 2 | 3 | 4 | 5 | 6 | 7; color: BeltColor; label: string; short: string; minXp: number };
export type XpEvent = { id: string; emoji: string; text: string; xp: number; ago?: string; kind: "learn" | "research" | "club" | "practice" | "family" };
export type Reputation = { pickPositivePct: number; resolvedPicks: number };
export type MemberIdentity = { memberId: string; name: string; initial: string; color: string; lifetimeXp: number; weekXp: number;
  /** Highest belt LEVEL passed (fic_belt_awards). 1 = the starting belt. XP only unlocks the test. */
  awardedLevel: number };
export type ClubXpGoal = { current: number; goal: number; window: string; milestone: string };
export type XpBoardRow = { rank: number; memberId: string; name: string; initial: string; color: string; lifetimeXp: number; deltaXp: number; awardedLevel: number; isYou?: boolean };
export type XpLeaderboard = { windows: string[]; scopes: string[]; rows: XpBoardRow[]; callout: string; otherBoards: { emoji: string; label: string; href: string }[] };
export type PromotionSummary = { belt: Belt; lessons: number; research: number; drills: number; clubActions: number };

/* ── Round 6: collective-performance workspace + performance-first Home + Community destination (canvas v9/v10) ── */
export type DecisionMarker = { idx: number; label: string; kind: "add" | "trim" | "reject" | "vote" | "pick" };
export type PerfSeries = { range: string; club: number[]; benchmark: number[]; markers: DecisionMarker[] };
export type ClubOverview = {
  members: number; households: number; streakWeeks: number;
  value: number; stake?: number; priced?: number; ytdPct: number; benchmarkPct: number; ranges: string[]; series: PerfSeries[];
  metrics: { bestPick: { symbol: string; pct: number; by: string } | null; winRatePct: number | null; resolved: number; verified: { connected: number; adults: number; syncedAgo: string } };
  topInvestors: { rank: number; memberId: string; name: string; picks: number; verified?: boolean; ytdPct: number }[];
  boards: string[];
  activeDecision: { proposalId: string; title: string; by: string; hoursLeft: number; voted: number; eligible: number; waitingOn?: string } | null;
  research: { symbol: string; name: string; assigneeId: string; assignee: string; gated?: boolean; due: string; comments?: number; note?: string; status: "open" | "ready" }[];
  happened: { id: string; actorId: string; actor: string; text: string; ago?: string; pct?: number }[];
};
export type PortfolioTab = {
  allocation: { label: string; pct: number; color: string }[];
  contributor: { symbol: string; pp: number }; detractor: { symbol: string; pp: number };
  holdings: { symbol: string; name: string; weightPct: number; returnPct: number; sinceAddPct?: number | null; origin?: string; link?: { label: string; href: string } }[];
  concentration: { text: string; lessonLabel: string; minutes: number; href: string } | null;
  journal: { date: string; title: string; by?: string; vote?: string; believed?: string; wrongIf?: string; review?: string; learned?: string; since?: string; rightCall?: string }[];
};
export type MemberCard = {
  memberId: string; name: string; role?: "OWNER" | "ADMIN" | "PRACTICE INVESTOR 🎓"; trust: "verified" | "self-reported" | "practice";
  facts: string[]; xpWeek: number; picksYtdPct: number; extra?: string;
};
export type HomePulse = {
  greeting: string; me: { value: number; ytdPct: number; note: string; series: number[]; markers: DecisionMarker[] };
  club: { value: number; ytdPct: number; series: number[]; markers: DecisionMarker[] };
  ranges: string[];
  tiles: { bestPick: { symbol: string; pct: number }; clubRank: { rank: number; of: number }; xp: number };
  clubSnapshot: { name: string; members: number; value: number; ytdPct: number; verified: string };
  decision: { proposalId: string; text: string; voted: number; eligible: number; hoursLeft: number };
  stream: { id: string; actorId?: string; actor: string; text: string; ago?: string; pct?: number; href: string }[];
  continueCard: { title: string; sub: string; href: string };
};
export type CommunityPost =
  | { kind: "pick"; id: string; author: string; authorId?: string; belt?: string; ago: string; symbol: string; name: string; stance: PickStance; reason: string; sincePct: number; verified?: boolean; likes: number; comments: number; views: number }
  | { kind: "clubvote"; id: string; club: string; visibility: "PUBLIC"; ago: string; question: string; leading: { label: string; pct: number }; split: { add: number; watch: number; pass: number }; voted: number; eligible: number; closesIn: string }
  | { kind: "promotion"; id: string; author: string; authorId?: string; belt: string; ago: string; toBelt: string; xp: number };
export type CommunityChat = { id: string; name: string; emoji: string; members: number; last: string; ago: string; unread?: number };
export type CommunityClub = { id: string; name: string; emoji: string; members: number; blurb: string; ytdPct?: number; joined?: boolean };
export type CommunityLive = { id: string; title: string; host: string; status: "live" | "upcoming"; when?: string; inRoom?: number };
