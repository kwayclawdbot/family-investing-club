import type { MyPortfolio, ClubConsensus, FicConsensus, DiscoverSignals, VerifiedExposure, Leaderboards, Brokerage } from "@/lib/types";

export const brokerages: { id: string; name: string }[] = [{ id: "fidelity", name: "Fidelity" }, { id: "schwab", name: "Schwab" }, { id: "more", name: "More…" }];
export const connectedBrokerage: Brokerage = { id: "fidelity", name: "Fidelity", last4: "8214", syncedAgo: "12 min ago", connected: true };

export const myPortfolio: MyPortfolio = {
  brokerage: connectedBrokerage,
  value: 46210,
  ytdPct: 12.4,
  holdings: [
    { symbol: "VOO", name: "S&P 500 ETF", weightPct: 21, bucket: "ETFs" },
    { symbol: "QQQ", name: "Nasdaq 100 ETF", weightPct: 13, bucket: "ETFs" },
    { symbol: "NVDA", name: "Nvidia", weightPct: 17, bucket: "Tech" },
    { symbol: "AAPL", name: "Apple", weightPct: 14, bucket: "Tech" },
    { symbol: "MSFT", name: "Microsoft", weightPct: 10, bucket: "Tech" },
    { symbol: "KO", name: "Coca-Cola", weightPct: 8, bucket: "Consumer" },
    { symbol: "COST", name: "Costco", weightPct: 6, bucket: "Consumer" },
  ],
  allocation: [
    { label: "ETFs", pct: 34, color: "bg-green-2" },
    { label: "Tech", pct: 24, color: "bg-orange" },
    { label: "NVDA", pct: 17, color: "bg-purple" },
    { label: "Consumer", pct: 14, color: "bg-gold" },
    { label: "Cash", pct: 11, color: "bg-line-3" },
  ],
  sharing: { club: "positions", publicBadge: true },
  overlap: { symbol: "NVDA", realPct: 17, modelPct: 12, lessonHref: "/learn/path/build-a-portfolio", lessonLabel: "Overlap & concentration", minutes: 4 },
};

export const clubConsensus: Record<string, ClubConsensus> = {
  NVDA: {
    symbol: "NVDA", confidencePct: 78, buy: 5, watch: 2, pass: 1, verifiedOwners: 4, modelTargetPct: 10, verifiedExposurePct: 17,
    thesis: "AI infrastructure demand",
    why: "The club's reasons cluster around one thesis: AI infrastructure demand. Andwele and Dad point to data-center chips; Mom flags valuation (P/E ~60) as the main worry — the lone Pass.",
    voters: ["andwele", "dad", "kway", "mom"], totalPicks: 8,
  },
  AAPL: { symbol: "AAPL", confidencePct: 71, buy: 3, watch: 1, pass: 0, verifiedOwners: 2, modelTargetPct: 12, verifiedExposurePct: 17, thesis: "services money is the quiet giant", why: "Andwele leads on services growth; Kway and Mom hold it. No Pass votes.", voters: ["andwele", "kway", "mom"], totalPicks: 4 },
  COST: { symbol: "COST", confidencePct: 82, buy: 3, watch: 1, pass: 0, verifiedOwners: 1, modelTargetPct: null, verifiedExposurePct: 6, thesis: "membership renewals", why: "Everyone shops there; Mom's research on 93% renewals anchors the Buy case. Not yet in the club model.", voters: ["kway", "mom", "arielle"], totalPicks: 4 },
};
export const ficConsensus: Record<string, FicConsensus> = {
  NVDA: { symbol: "NVDA", picks: 12482, buyPct: 68, watchPct: 23, passPct: 9, verifiedOwners: 3941 },
  AAPL: { symbol: "AAPL", picks: 9870, buyPct: 61, watchPct: 31, passPct: 8, verifiedOwners: 4412 },
  COST: { symbol: "COST", picks: 6120, buyPct: 71, watchPct: 24, passPct: 5, verifiedOwners: 2210 },
  VOO: { symbol: "VOO", picks: 15320, buyPct: 84, watchPct: 14, passPct: 2, verifiedOwners: 7810 },
  KO: { symbol: "KO", picks: 4210, buyPct: 55, watchPct: 38, passPct: 7, verifiedOwners: 1980 },
};

export const discoverSignals: DiscoverSignals = {
  familiesLikeYours: [
    { symbol: "COST", name: "Costco", line: "owned by 41% of family clubs · 🟢 71% Buy consensus" },
    { symbol: "DIS", name: "Disney", line: 'most-picked "company our kids know" this month' },
    { symbol: "VOO", name: "S&P 500 ETF", line: "the most-held first position across FIC" },
  ],
  mostResearched: [
    { symbol: "NVDA", name: "Nvidia", line: "412 club research notes this week" },
    { symbol: "CEG", name: "Constellation Energy", line: "riding the Nuclear idea · 287 notes" },
  ],
  mostOwnedVerified: ["VOO", "AAPL", "MSFT"],
  mostDiscussed: ["NVDA", "COST", "TSLA"],
  trendingParents: { text: "Trending among parents: 529-friendly ETFs — 3 ideas, 1 live session", href: "/community" },
};

export const verifiedExposure: VerifiedExposure = {
  connectedAdults: 3, totalAdults: 4,
  rows: [
    { symbol: "NVDA", name: "Nvidia", ownersOf: "3 of 3 own it", actualPct: 24, modelPct: 10, warn: true },
    { symbol: "AAPL", name: "Apple", ownersOf: "2 of 3 own it", actualPct: 17, modelPct: 12 },
    { symbol: "VOO", name: "S&P 500 ETF", ownersOf: "3 of 3 own it", actualPct: 21, modelPct: 40 },
    { symbol: "KO", name: "Coca-Cola", ownersOf: "1 of 3 owns it", actualPct: 6, modelPct: null },
  ],
  mismatch: { text: "We agreed on 10% NVDA — we actually hold 24%. That's concentration risk.", lessonLabel: "Concentration lesson", minutes: 5, lessonHref: "/learn/path/build-a-portfolio" },
};

export const leaderboards: Leaderboards = {
  boards: [{ id: "pick", label: "Pick Performance" }, { id: "practice", label: "Practice" }, { id: "verified", label: "Verified ✓" }, { id: "research", label: "Research" }, { id: "learning", label: "Learning" }],
  window: "6-MONTH PICK RETURN",
  rows: [
    { rank: 1, memberId: "arielle", name: "Arielle", ageLabel: "11", basis: "PRACTICE", valuePct: 31 },
    { rank: 2, memberId: "andwele", name: "Andwele", ageLabel: "15", basis: "PICK", valuePct: 24 },
    { rank: 3, memberId: "kway", name: "Kway (you)", basis: "VERIFIED ✓", valuePct: 18 },
    { rank: 4, memberId: "mom", name: "Mom", basis: "PICK", valuePct: 11 },
  ],
  footnote: "Arielle leads on reasoning, not capital — practice picks are timestamped and scored exactly like adult picks.",
  others: [
    { emoji: "🧠", label: "Consistency · multi-period", leader: "Dad leads" },
    { emoji: "🔍", label: "Research contribution", leader: "Mom leads" },
    { emoji: "🎓", label: "Learning XP", leader: "Arielle leads" },
  ],
};
