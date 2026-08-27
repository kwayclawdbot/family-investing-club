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
