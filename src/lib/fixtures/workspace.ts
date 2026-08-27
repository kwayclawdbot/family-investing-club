import type { ClubOverview, PortfolioTab, MemberCard, HomePulse, CommunityPost, CommunityChat, CommunityClub, CommunityLive, PerfSeries } from "@/lib/types";

const wave = (n: number, start: number, end: number, vol: number, seed = 1) => {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280 - 0.5) * vol;
  return Array.from({ length: n }, (_, i) => +(start + ((end - start) * i) / (n - 1) + rnd()).toFixed(2));
};
const mk = (range: string, s: number, e: number, bs: number, be: number, seed: number, markers: PerfSeries["markers"]): PerfSeries => ({
  range, club: wave(40, s, e, (e - s) * 0.08, seed), benchmark: wave(40, bs, be, (be - bs) * 0.06, seed + 3), markers,
});

export const clubOverview: ClubOverview = {
  members: 5, households: 2, streakWeeks: 23,
  value: 28450, ytdPct: 8.24, benchmarkPct: 6.21, ranges: ["1M", "3M", "YTD", "1Y", "ALL"],
  series: [
    mk("1M", 27600, 28450, 27700, 28150, 11, [{ idx: 30, label: "added COST", kind: "add" }]),
    mk("3M", 26400, 28450, 26800, 28100, 12, [{ idx: 12, label: "trimmed NVDA", kind: "trim" }, { idx: 33, label: "added COST", kind: "add" }]),
    mk("YTD", 26290, 28450, 26700, 28320, 13, [{ idx: 9, label: "rejected TSLA", kind: "reject" }, { idx: 21, label: "trimmed NVDA", kind: "trim" }, { idx: 35, label: "added COST", kind: "add" }]),
    mk("1Y", 24100, 28450, 24900, 28300, 14, [{ idx: 6, label: "rejected TSLA", kind: "reject" }, { idx: 24, label: "trimmed NVDA", kind: "trim" }, { idx: 36, label: "added COST", kind: "add" }]),
    mk("ALL", 20000, 28450, 21200, 28300, 15, [{ idx: 3, label: "VOO core", kind: "add" }, { idx: 26, label: "trimmed NVDA", kind: "trim" }, { idx: 37, label: "added COST", kind: "add" }]),
  ],
  metrics: { bestPick: { symbol: "NVDA", pct: 31, by: "Andwele" }, winRatePct: 68, resolved: 19, verified: { connected: 3, adults: 4, syncedAgo: "12 min ago" } },
  topInvestors: [
    { rank: 1, memberId: "andwele", name: "Andwele", picks: 7, ytdPct: 24.6 },
    { rank: 2, memberId: "kway", name: "Kway (you)", picks: 5, verified: true, ytdPct: 18.2 },
    { rank: 3, memberId: "dad", name: "Dad", picks: 6, verified: true, ytdPct: 12.4 },
  ],
  boards: ["Picks", "Practice", "XP", "Research"],
  activeDecision: { proposalId: "add-ceg-4", title: "Add CEG · 4% → 8%", by: "Dad", hoursLeft: 8, voted: 3, eligible: 4, waitingOn: "Arielle 🎓" },
  research: [
    { symbol: "AMZN", name: "Amazon", assigneeId: "arielle", assignee: "Arielle", gated: true, due: "due Thu", comments: 4, status: "open" },
    { symbol: "COST", name: "Costco", assigneeId: "mom", assignee: "Mom", due: "ready", note: "renewals are the moat", status: "ready" },
  ],
  happened: [
    { id: "h1", actorId: "andwele", actor: "Andwele", text: "picked NVDA · Buy", pct: 26 },
    { id: "h2", actorId: "dad", actor: "Dad", text: "earned Yellow Belt II 🎉", ago: "1d" },
  ],
};

export const portfolioTab: PortfolioTab = {
  allocation: [
    { label: "ETFs", pct: 40, color: "bg-green-2" },
    { label: "Tech", pct: 22, color: "bg-orange" },
    { label: "Energy", pct: 17, color: "bg-purple" },
    { label: "Consumer", pct: 12, color: "bg-gold" },
    { label: "Cash", pct: 9, color: "bg-line-3" },
  ],
  contributor: { symbol: "NVDA", pp: 2.1 }, detractor: { symbol: "KO", pp: -0.4 },
  holdings: [
    { symbol: "VOO", name: "S&P 500 ETF", weightPct: 40, returnPct: 9.0 },
    { symbol: "NVDA", name: "Nvidia", weightPct: 12, returnPct: 31, link: { label: "vote 3-1 →", href: "/club/vote/nvda-12" } },
    { symbol: "CEG", name: "Constellation", weightPct: 4, returnPct: 18, link: { label: "open proposal ↑8%", href: "/club/vote/add-ceg-4" } },
    { symbol: "AAPL", name: "Apple", weightPct: 10, returnPct: 6 },
    { symbol: "KO", name: "Coca-Cola", weightPct: 8, returnPct: 3 },
    { symbol: "DIS", name: "Disney", weightPct: 6, returnPct: -2 },
  ],
  concentration: { text: "tech + NVDA = 34% of the model.", lessonLabel: "Diversification lesson", minutes: 5, href: "/learn/path/build-a-portfolio" },
  journal: [
    { date: "Aug 24", title: "Bought CEG 4%", by: "Dad", vote: "4-0", believed: "AI needs baseload power.", wrongIf: "deals stall.", review: "Nov earnings.", since: "+18%" },
    { date: "Jul 12", title: "Trimmed NVDA 15→12%", vote: "3-1", learned: "single-stock concentration. All 4 finished the lesson 🎓", rightCall: "risk ↓, still +31%" },
  ],
};

export const memberCards: MemberCard[] = [
  { memberId: "kway", name: "Kway", role: "OWNER", trust: "verified", facts: ["✓ Verified", "5 picks", "12 research notes"], xpWeek: 430, picksYtdPct: 18.2 },
  { memberId: "dad", name: "Dad", role: "ADMIN", trust: "verified", facts: ["✓ Verified", "6 picks", "leads Consistency board"], xpWeek: 80, picksYtdPct: 12.4 },
  { memberId: "mom", name: "Mom", trust: "verified", facts: ["✓ Verified", "3 picks", "top researcher (8 notes)"], xpWeek: 95, picksYtdPct: 6.7 },
  { memberId: "andwele", name: "Andwele", trust: "self-reported", facts: ["Self-reported", "7 picks", "best pick NVDA +31%"], xpWeek: 150, picksYtdPct: 24.6 },
  { memberId: "arielle", name: "Arielle", role: "PRACTICE INVESTOR 🎓", trust: "practice", facts: ["Practice only", "AMZN research due Thu"], xpWeek: 240, picksYtdPct: 9.3, extra: "🥇 XP board" },
];

export const homePulse: HomePulse = {
  greeting: "Good morning, Kway",
  me: { value: 28450, ytdPct: 8.24, note: "practice + verified", series: wave(40, 26290, 28450, 180, 21), markers: [{ idx: 14, label: "NVDA pick", kind: "pick" }, { idx: 33, label: "CEG vote", kind: "vote" }] },
  club: { value: 28450, ytdPct: 8.24, series: wave(40, 26290, 28450, 200, 13), markers: [{ idx: 21, label: "trimmed NVDA", kind: "trim" }, { idx: 35, label: "added COST", kind: "add" }] },
  ranges: ["YTD", "1W", "1M", "1Y", "ALL"],
  tiles: { bestPick: { symbol: "NVDA", pct: 26.4 }, clubRank: { rank: 2, of: 5 }, xp: 2640 },
  clubSnapshot: { name: "The Mensah Club", members: 5, value: 28450, ytdPct: 8.24, verified: "3 of 4 adults verified" },
  decision: { proposalId: "add-ceg-4", text: "Club is deciding on CEG +4%", voted: 3, eligible: 4, hoursLeft: 8 },
  stream: [
    { id: "s1", actorId: "andwele", actor: "Andwele", text: "picked NVDA · Buy", pct: 26, href: "/club/pick/andwele-nvda" },
    { id: "s2", actor: "Sarah", text: "commented on your Costco research", ago: "2h", href: "/club/research" },
    { id: "s3", actorId: "dad", actor: "Dad", text: "earned Yellow Belt II 🎉", ago: "1d", href: "/club?tab=members" },
  ],
  continueCard: { title: "Continue: How to read a P/E ratio", sub: "4 min left · relevant to the CEG vote", href: "/lesson/if-7" },
};

export const communityPosts: CommunityPost[] = [
  { kind: "pick", id: "cp1", author: "Sarah J.", belt: "Blue Belt", ago: "3h", symbol: "AMZN", name: "Amazon", stance: "buy", reason: "Cloud growth + ads momentum are long-term catalysts", sincePct: 18.7, verified: true, likes: 24, comments: 12, views: 356 },
  { kind: "clubvote", id: "cv1", club: "Garcia Family Club", visibility: "PUBLIC", ago: "6h", question: "Add Costco (COST) to the portfolio?", leading: { label: "ADD", pct: 73 }, split: { add: 73, watch: 18, pass: 9 }, voted: 3, eligible: 5, closesIn: "8h" },
  { kind: "promotion", id: "pr1", author: "Andwele", authorId: "andwele", belt: "Yellow II", ago: "1d", toBelt: "Yellow Belt II", xp: 800 },
];
export const communityChats: CommunityChat[] = [
  { id: "mensah", name: "The Mensah Club", emoji: "🏠", members: 5, last: "Mom: renewals are the moat — presenting Thu", ago: "5h", unread: 2 },
  { id: "beginners", name: "Beginners Circle", emoji: "🌱", members: 1240, last: "Coach Tia: no question is too basic", ago: "1h" },
  { id: "nuclear", name: "Nuclear idea · research room", emoji: "⚡", members: 125, last: "Sarah J.: CCJ supply update", ago: "3h" },
];
export const communityClubs: CommunityClub[] = [
  { id: "garcia-family", name: "Garcia Family Club", emoji: "👨‍👩‍👧", members: 5, blurb: "Public family club · votes visible", ytdPct: 9.1 },
  { id: "dividend-beginners", name: "Dividend Beginners", emoji: "💰", members: 640, blurb: "public portfolio +6.1% YTD", ytdPct: 6.1 },
  { id: "clean-energy-investors", name: "Clean Energy Investors", emoji: "⚡", members: 1200, blurb: "4 active ideas · moderated" },
];
export const communityLive: CommunityLive[] = [
  { id: "market-open-talk", title: "Market Open Talk", host: "Coach Tia", status: "live", inRoom: 128 },
  { id: "family-investing-night", title: "Family Investing Night: Pick a company you use", host: "Coach Marcus", status: "upcoming", when: "Thu · 7:00 PM" },
  { id: "reading-a-chart", title: "Reading a Chart Without Fear", host: "Coach Tia", status: "upcoming", when: "Sat · 1:00 PM" },
];
