import type { User, Family, LearningPath, Question, Company, Portfolio, Idea, ClubPost, Badge, Mastery } from "@/lib/types";

/* ── Persona: Kway (adult beginner, Investor level) ─────────────────── */
export const user: User = {
  id: "u_kway",
  firstName: "Kway",
  lastName: "Mensah",
  level: 8,
  levelXp: 2140,
  levelXpMax: 2500,
  weekXp: 430,
  streakDays: 12,
  lessonsDone: 23,
  explanationLevel: "Investor",
  dailyGoalXp: 10,
  todayXp: 6,
};

export const family: Family = {
  name: "The Mensah Family",
  inviteCode: "MENSAH-23",
  streakDays: 12,
  streakWeeks: 23,
  members: [
    { id: "m1", name: "Kway", xp: 430, color: "bg-green-3", isYou: true },
    { id: "m2", name: "Andwele", xp: 385, color: "bg-green-3" },
    { id: "m3", name: "Arielle", xp: 240, color: "bg-gold" },
    { id: "m4", name: "Mom", xp: 120, color: "bg-coral" },
  ],
  weeklyChallenge: { title: "Research one company our family uses every day" },
  portfolio: { value: 28450.75, ytdPct: 8.24 },
};

/** Home "Family League" — all-time XP, top 3 (labelled all-time in the UI). */
export const league = [
  { name: "Andwele", xp: 1240, color: "bg-green-3", medal: "🥇" },
  { name: "Dad", xp: 1080, color: "bg-coral", medal: "🥈" },
  { name: "Arielle", xp: 720, color: "bg-gold", medal: "🥉" },
];

/* ── Curriculum (plan §5.1) ─────────────────────────────────────────── */
export const paths: LearningPath[] = [
  {
    slug: "money-basics", title: "Money Basics", lessons: 12, checkpoints: 2, hours: 2, progress: 100, status: "done",
    blurb: "Money, income, expenses, saving, debt, interest and inflation.", xp: 240, concepts: 9, badges: 1,
    units: [
      { id: "mb1", title: "What Money Does", lessons: 3, blurb: "earn, spend, save" },
      { id: "mb2", title: "Interest & Debt", lessons: 4, blurb: "how money grows — or shrinks" },
      { id: "mb3", title: "Inflation", lessons: 3, blurb: "why prices rise" },
      { id: "mbc", title: "Checkpoint: Money Ready", lessons: 1, blurb: "unit test · earn the badge", kind: "checkpoint" },
    ],
  },
  {
    slug: "investing-foundations", title: "Investing Foundations", lessons: 20, checkpoints: 3, hours: 3.5, progress: 35, status: "active", nextLesson: 7,
    blurb: "Risk, return, compounding, ownership and time horizon.", xp: 400, concepts: 12, badges: 2,
    units: [
      { id: "if1", title: "Saving vs. Investing", lessons: 4, blurb: "why saving isn't enough" },
      { id: "if2", title: "Risk & Return", lessons: 5, blurb: "the trade-off behind every investment" },
      { id: "if3", title: "Compounding", lessons: 4, blurb: "the eighth wonder" },
      { id: "if4", title: "Ownership & Time", lessons: 4, blurb: "what a share really is" },
      { id: "ifc", title: "Checkpoint: Foundations", lessons: 1, blurb: "unit test · earn the badge", kind: "checkpoint" },
    ],
    lessonList: [
      { id: "l1", index: 1, title: "Welcome to FIC!", subtitle: "Start Here", status: "done" },
      { id: "l2", index: 2, title: "What is Money?", status: "done" },
      { id: "l3", index: 3, title: "Saving vs. Investing", status: "done" },
      { id: "c1", index: 3, title: "Checkpoint Quiz 1", subtitle: "Great job!", status: "checkpoint" },
      { id: "l4", index: 4, title: "What is a Stock?", subtitle: "Lesson 4 · Up next", status: "next", minutes: 8 },
      { id: "l5", index: 5, title: "Why Companies Go Public", subtitle: "Lesson 5", status: "locked" },
      { id: "l6", index: 6, title: "How the Stock Market Works", subtitle: "Lesson 6", status: "locked" },
      { id: "ch1", index: 6, title: "Challenge: Stock Basics", subtitle: "Unit review", status: "challenge" },
    ],
  },
  {
    slug: "stock-market-101", title: "Stock Market 101", lessons: 24, checkpoints: 3, hours: 4, progress: 0, status: "locked",
    blurb: "How stocks, exchanges, indexes and orders actually work — and who's on the other side of every trade.", xp: 480, concepts: 14, badges: 2,
    units: [
      { id: "sm1", title: "Stocks & Ownership", lessons: 5, blurb: "what a share really is" },
      { id: "sm2", title: "Exchanges & Indexes", lessons: 4, blurb: "where trading happens" },
      { id: "sm3", title: "Orders & Prices", lessons: 5, blurb: "market vs. limit, spreads" },
      { id: "sm4", title: "Market Participants", lessons: 4, blurb: "who moves the market" },
      { id: "smc", title: "Checkpoint: Market Ready", lessons: 1, blurb: "unit test · earn the badge", kind: "checkpoint" },
    ],
  },
  {
    slug: "build-a-portfolio", title: "Build a Portfolio", lessons: 16, checkpoints: 2, hours: 3, progress: 0, status: "locked",
    blurb: "Diversification, ETFs, goals.", xp: 320, concepts: 10, badges: 1,
    units: [
      { id: "bp1", title: "Diversification", lessons: 5, blurb: "don't put all your eggs in one basket" },
      { id: "bp2", title: "ETFs & Index Funds", lessons: 5, blurb: "own the whole market" },
      { id: "bp3", title: "Goals & Rebalancing", lessons: 5, blurb: "keep the plan on track" },
      { id: "bpc", title: "Checkpoint: Portfolio Builder", lessons: 1, blurb: "unit test · earn the badge", kind: "checkpoint" },
    ],
  },
  {
    slug: "company-analysis", title: "Company Analysis", lessons: 18, checkpoints: 2, hours: 3.5, progress: 0, status: "locked",
    blurb: "Read a business like a pro.", xp: 360, concepts: 12, badges: 1,
    units: [
      { id: "ca1", title: "How Companies Make Money", lessons: 5, blurb: "revenue and profit" },
      { id: "ca2", title: "The Balance Sheet", lessons: 5, blurb: "what a company owns and owes" },
      { id: "ca3", title: "Valuation", lessons: 7, blurb: "is it expensive?" },
      { id: "cac", title: "Checkpoint: Analyst", lessons: 1, blurb: "unit test · earn the badge", kind: "checkpoint" },
    ],
  },
  { slug: "crypto-foundations", title: "Crypto Foundations", lessons: 10, checkpoints: 1, hours: 2, progress: 0, status: "available", elective: true, blurb: "What a blockchain is and isn't.", xp: 200, concepts: 6, badges: 1, units: [] },
  { slug: "real-estate", title: "Real Estate", lessons: 8, checkpoints: 1, hours: 1.5, progress: 0, status: "available", elective: true, blurb: "Property as an asset class.", xp: 160, concepts: 5, badges: 1, units: [] },
];

export const continueLesson = {
  pathTitle: "Investing Foundations",
  pathSlug: "investing-foundations",
  lessonNo: 7,
  lessonTotal: 20,
  title: "Why do stock prices move?",
  minutes: 8,
  progress: 32,
  lessonId: "if-7",
};

export const questions: Question[] = [
  {
    id: "q1",
    lessonId: "if-7",
    concept: "Supply & Demand",
    prompt: "If more people want to buy a stock than sell it, what usually happens to the price?",
    options: ["The price goes up", "The price goes down", "The price stays the same", "Trading is paused"],
    answerIdx: 0,
    explanation: "When buyers outnumber sellers, buyers have to offer more to get shares — so the price rises. That's supply and demand at work.",
    xp: 10,
  },
  {
    id: "q2",
    lessonId: "if-7",
    concept: "Supply & Demand",
    prompt: "A company reports much lower profits than expected. Which is most likely?",
    options: ["More people want to sell, price falls", "More people want to buy, price rises", "The exchange closes early", "Nothing changes"],
    answerIdx: 0,
    explanation: "Bad news makes holders want out and buyers hesitate. More sellers than buyers pushes the price down.",
    xp: 10,
  },
];

/* ── Markets (sample data) ──────────────────────────────────────────── */
const wave = (n: number, start: number, end: number, vol: number, seed = 1) => {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280 - 0.5) * vol;
  return Array.from({ length: n }, (_, i) => +(start + ((end - start) * i) / (n - 1) + rnd()).toFixed(2));
};
export const companies: Company[] = [
  {
    symbol: "AAPL", name: "Apple Inc.", price: 229.31, change: 3.82, changePct: 1.69,
    series: { "1D": wave(40, 225.6, 229.3, 1.4, 7), "1W": wave(40, 222, 229.3, 2.5, 3), "1M": wave(40, 214, 229.3, 4, 5), "3M": wave(40, 196, 229.3, 6, 9), "1Y": wave(40, 172, 229.3, 9, 11), "5Y": wave(40, 88, 229.3, 14, 13) },
    understand: [
      { q: "Why did AAPL move today?" },
      { q: "How does Apple make money?" },
      { q: "Is Apple expensive?", concept: "P/E RATIO" },
      { q: "What would $100 invested 10 years ago be worth?" },
    ],
  },
  {
    symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 612.4, change: 5.46, changePct: 0.9,
    series: { "1D": wave(40, 607, 612.4, 1.2, 2), "1W": wave(40, 601, 612.4, 2, 4), "1M": wave(40, 588, 612.4, 3, 6), "3M": wave(40, 560, 612.4, 5, 8), "1Y": wave(40, 498, 612.4, 8, 10), "5Y": wave(40, 300, 612.4, 12, 12) },
    understand: [{ q: "What is an ETF?" , concept: "ETF"}, { q: "What's inside VOO?" }, { q: "Why do people call this 'the market'?" }],
  },
  {
    symbol: "KO", name: "Coca-Cola Co.", price: 70.05, change: -0.28, changePct: -0.4,
    series: { "1D": wave(40, 70.4, 70.05, 0.3, 3), "1W": wave(40, 69.5, 70.05, 0.6, 5), "1M": wave(40, 68, 70.05, 1, 7), "3M": wave(40, 64, 70.05, 1.5, 9), "1Y": wave(40, 60, 70.05, 2, 11), "5Y": wave(40, 45, 70.05, 4, 13) },
    understand: [{ q: "What is a dividend?", concept: "DIVIDEND" }, { q: "How does Coca-Cola make money?" }, { q: "Why is KO called a 'defensive' stock?" }],
  },
  {
    symbol: "NVDA", name: "NVIDIA Corp.", price: 182.6, change: 7.36, changePct: 4.2,
    series: { "1D": wave(40, 175.2, 182.6, 2, 4), "1W": wave(40, 170, 182.6, 3, 6), "1M": wave(40, 160, 182.6, 5, 8), "3M": wave(40, 130, 182.6, 8, 10), "1Y": wave(40, 105, 182.6, 12, 12), "5Y": wave(40, 20, 182.6, 15, 14) },
    understand: [{ q: "Why did NVIDIA go up today?" }, { q: "How does NVIDIA make money?" }, { q: "Is NVIDIA expensive?", concept: "P/E RATIO" }],
  },
];

export const portfolio: Portfolio = {
  cash: 10000,
  totalValue: 10985.4,
  dayChange: 124.35,
  dayChangePct: 1.15,
  series: wave(40, 10000, 10985, 180, 21),
  holdings: [
    { symbol: "AAPL", name: "Apple Inc.", shares: 2, value: 458.62, changePct: 1.7 },
    { symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: 1, value: 612.4, changePct: 0.9 },
    { symbol: "KO", name: "Coca-Cola Co.", shares: 3, value: 210.15, changePct: -0.4 },
  ],
  insight: { text: "42% of your portfolio is one stock.", lessonTitle: "Diversification", lessonMinutes: 6, lessonHref: "/learn/path/build-a-portfolio" },
};

/* ── Kai ────────────────────────────────────────────────────────────── */
export const kaiPrompts = [
  "Explain P/E ratio like I'm 10",
  "Why did NVIDIA go up today?",
  "Quiz me on dividend investing",
  "Help me analyze this company",
];
export const kaiSample = {
  question: "What's a dividend?",
  answer: "A dividend is a slice of a company's profit paid to shareholders — like a thank-you check for owning the stock.",
  lessonLabel: "LESSON: DIVIDENDS",
  lessonHref: "/learn/path/investing-foundations",
};

/* ── Club ───────────────────────────────────────────────────────────── */
export const ideas: Idea[] = [
  {
    id: "nuclear-next-decade",
    title: "Nuclear Energy: The Next Decade",
    author: "Sarah J.",
    ago: "2h ago",
    status: "RESEARCHING",
    summary: "AI and data centers need a LOT of power. Nuclear could be one of the biggest beneficiaries.",
    opportunity: "AI and data centers need a LOT of power. Nuclear is reliable, carbon-free baseload — and utilities are signing long-term deals with big tech. Time horizon: 5–10 years.",
    horizon: "5–10 years",
    companies: [
      { symbol: "CEG", name: "Constellation Energy", changePct: 2.1 },
      { symbol: "VST", name: "Vistra Corp.", changePct: 1.9 },
      { symbol: "CCJ", name: "Cameco Corp.", changePct: 1.4 },
      { symbol: "SMR", name: "NuScale Power", changePct: -0.8 },
    ],
    risks: "Regulatory delays · construction costs · uranium supply · long timelines before new reactors earn.",
    concepts: ["SECTORS", "VALUATION"],
    likes: 125,
    comments: 32,
    saves: 12,
  },
];
export const clubFeed: ClubPost[] = [
  { kind: "idea", idea: ideas[0] },
  { kind: "portfolio", name: "FIC Growth Portfolio", ytdPct: 14.8, holdings: 18, followers: 347 },
  {
    kind: "poll",
    author: "Michael T.",
    ago: "3h ago",
    question: "Which sector will perform best in the next 6 months?",
    options: [
      { label: "Technology", pct: 42 },
      { label: "Energy", pct: 27 },
      { label: "Healthcare", pct: 18 },
      { label: "Other", pct: 13 },
    ],
  },
];

/* ── Profile ────────────────────────────────────────────────────────── */
export const badges: Badge[] = [
  { id: "b1", emoji: "🌱", label: "First Lesson" },
  { id: "b2", emoji: "📈", label: "First Practice Trade" },
  { id: "b3", emoji: "⭐", label: "Quiz Whiz" },
  { id: "b4", emoji: "🧺", label: "Diversifier" },
];
export const mastery: Mastery[] = [
  { path: "Money Basics", pct: 92 },
  { path: "Investing Foundations", pct: 74 },
  { path: "Stock Market 101", pct: 38 },
];

/* ── Onboarding option sets ─────────────────────────────────────────── */
export const onboarding = {
  who: [
    { id: "me", title: "Just me", sub: "A personal learning journey" },
    { id: "family", title: "Me + my family", sub: "Shared streaks, challenges & a family portfolio" },
    { id: "class", title: "My class or group", sub: "For educators and organizations" },
  ],
  start: [
    { id: "new", title: "I'm brand new to investing", sub: "Start with Money Basics", level: "Investor" as const },
    { id: "some", title: "I know some basics", sub: "Take a 3-minute placement checkpoint", level: "Investor" as const },
    { id: "invest", title: "I already invest or trade", sub: "Unlock analysis & trading paths", level: "Trader" as const },
  ],
  goals: [
    "Understand money basics", "Invest with confidence", "Teach my kids about money", "Learn to trade",
    "Build a weekly family habit", "Research companies together", "Plan for retirement", "Understand the news",
  ],
  daily: [
    { min: 5, label: "Casual", xp: 10 },
    { min: 10, label: "Regular", xp: 20 },
    { min: 15, label: "Serious", xp: 30 },
    { min: 20, label: "Intense", xp: 40 },
  ],
};
