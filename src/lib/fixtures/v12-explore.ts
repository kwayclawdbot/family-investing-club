/** v12 part 2 — Discover · Company · Learn · Lesson · Practice · Search (lane-local fixtures). */
export type DiscoverItem =
  | { kind: "stock"; symbol: string; name: string; social: string; tone?: "green" | "gold" }
  | { kind: "theme"; title: string; researching: string; symbols: string[] }
  | { kind: "person"; id: string; name: string; initial: string; color: string; belt: string; beltColor: string; line: string }
  | { kind: "circle"; id: string; emoji: string; name: string; line: string };
export const discoverStream: DiscoverItem[] = [
  { kind: "stock", symbol: "NVDA", name: "Nvidia", social: "4 people in your club follow it · earnings Wed" },
  { kind: "theme", title: "Nuclear Energy", researching: "1.2K researching", symbols: ["CEG", "VST", "CCJ"] },
  { kind: "stock", symbol: "COST", name: "Costco", social: "popular with long-term investors · 🟢 71% Buy", tone: "gold" },
  { kind: "person", id: "sarah-j", name: "Sarah J.", initial: "S", color: "#D98E73", belt: "Blue", beltColor: "#4E7DA6", line: "87% helpful research · AMZN thesis · 1.2K followers" },
  { kind: "circle", id: "nvda-earnings", emoji: "📊", name: "NVDA Earnings Circle", line: "⏳ 12 days left · 842 people in" },
  { kind: "stock", symbol: "AAPL", name: "Apple", social: "3 people in your club watch it · services thesis" },
  { kind: "person", id: "coach-tia", name: "Coach Tia", initial: "T", color: "#7BA05B", belt: "Black", beltColor: "#2E2A21", line: "FIC coach · live every weekday at the open" },
  { kind: "stock", symbol: "VOO", name: "S&P 500 ETF", social: "the most-held first position across FIC", tone: "green" },
];
export type Dossier = { exchange: string; sector: string; does: string; numbers: { pe: string; revGrowth: string; mktCap: string; grossMargin: string }; bull: string; bear: string };
export const dossiers: Record<string, Dossier> = {
  NVDA: { exchange: "NASDAQ", sector: "Semiconductors", does: "Designs the chips powering AI data centers, gaming and robotics — and sells the software ecosystem (CUDA) that locks developers in.", numbers: { pe: "60×", revGrowth: "+94%", mktCap: "$2.9T", grossMargin: "76%" }, bull: "Every AI data center needs their chips; backlog through 2027; software moat.", bear: "Priced for perfection at 60×; customers building their own chips." },
  AAPL: { exchange: "NASDAQ", sector: "Consumer Electronics", does: "Designs the iPhone, Mac and iPad — then earns increasingly from services running on those devices.", numbers: { pe: "34×", revGrowth: "+6%", mktCap: "$4.6T", grossMargin: "46%" }, bull: "Two billion devices, sticky services, huge buybacks.", bear: "Slow hardware growth; regulators circling the App Store." },
  COST: { exchange: "NASDAQ", sector: "Retail", does: "Sells groceries and household goods at thin margins — the real profit is the yearly membership that 93% of members renew.", numbers: { pe: "52×", revGrowth: "+8%", mktCap: "$482B", grossMargin: "11%" }, bull: "Renewal rate is the moat; members keep coming back.", bear: "Expensive for a retailer; growth depends on new warehouses." },
  VOO: { exchange: "NYSE", sector: "Index ETF", does: "One fund that owns the 500 biggest US companies — instant diversification for about $700 a share.", numbers: { pe: "24×", revGrowth: "—", mktCap: "$1.2T fund", grossMargin: "—" }, bull: "Owns the whole market; nobody beats it over decades.", bear: "You get the crashes too; top-heavy in tech." },
  KO: { exchange: "NYSE", sector: "Beverages", does: "Sells syrup and brands to bottlers worldwide — a fee on every Coke sold.", numbers: { pe: "26×", revGrowth: "+3%", mktCap: "$302B", grossMargin: "61%" }, bull: "63 straight dividend raises; defensive.", bear: "Slow growth; sugar and health trends." },
  CEG: { exchange: "NASDAQ", sector: "Utilities · Nuclear", does: "Runs the largest fleet of nuclear plants in the US and sells the carbon-free power under long-term deals with big tech.", numbers: { pe: "31×", revGrowth: "+12%", mktCap: "$98B", grossMargin: "—" }, bull: "AI data centers need baseload power; contracts keep landing.", bear: "Regulation and long timelines; priced for the story." },
};
export const genericDossier = (name: string): Dossier => ({ exchange: "US", sector: "—", does: `${name} — company summary arrives with the fundamentals feed.`, numbers: { pe: "—", revGrowth: "—", mktCap: "—", grossMargin: "—" }, bull: "No club bull case yet — start one from a Pick.", bear: "No bear case yet — the club hasn't researched this company." });
export const learnPath = { title: "Portfolio Building", done: 6, total: 10, next: { no: 7, title: "Understanding Valuation", sub: "5 minutes · unlocks the P/E concept your club keeps debating", href: "/lesson/valuation" },
  nodes: [ { title: "Diversification basics", state: "mastered" }, { title: "Position sizing", state: "done" }, { title: "Understanding Valuation", state: "next" }, { title: "Reading an earnings report", state: "locked" }, { title: "Checkpoint: build a mock portfolio", state: "checkpoint" } ] as { title: string; state: "mastered" | "done" | "next" | "locked" | "checkpoint" }[] };
export const practiceGames = [
  { id: "chart-rush", emoji: "📈", title: "Chart Rush", sub: "spot the trend · best 12/15", href: "/learn/chart-practice" },
  { id: "time-machine", emoji: "🕰", title: "Time Machine", sub: "invest in 2015, see 2025", href: "/learn/games/time-machine" },
  { id: "build-a-portfolio", emoji: "🧩", title: "Build-a-Portfolio", sub: "balance risk in 90 sec", href: "/learn/games/diversify-it" },
  { id: "headline-reactor", emoji: "📰", title: "Headline Reactor", sub: "guess the market's move", href: "/learn/games/headline-reactor" },
];
export const valuationRounds = [
  { symbol: "NVDA", name: "Nvidia", pe: 60, sector: "Semiconductors", sectorPe: 28, answer: "expensive", why: "60× vs a sector at 28× — investors are paying for years of growth up front." },
  { symbol: "KO", name: "Coca-Cola", pe: 26, sector: "Beverages", sectorPe: 22, answer: "expensive", why: "A bit above its sector — you pay for the dividend streak and safety." },
  { symbol: "VOO", name: "S&P 500 ETF", pe: 24, sector: "Whole market", sectorPe: 24, answer: "fair", why: "It IS the market — by definition it trades at the market multiple." },
  { symbol: "COST", name: "Costco", pe: 52, sector: "Retail", sectorPe: 20, answer: "expensive", why: "52× for a retailer is steep — the renewal rate is what people are paying for." },
  { symbol: "CEG", name: "Constellation Energy", pe: 31, sector: "Utilities", sectorPe: 18, answer: "expensive", why: "Utilities usually trade near 18×; the AI-power story adds a premium." },
  { symbol: "AAPL", name: "Apple", pe: 34, sector: "Consumer electronics", sectorPe: 30, answer: "fair", why: "Slightly above peers — services growth roughly justifies it." },
] as { symbol: string; name: string; pe: number; sector: string; sectorPe: number; answer: "cheap" | "fair" | "expensive"; why: string }[];
export const searchCircles = [{ id: "nvda-earnings", emoji: "📊", name: "NVDA Earnings Circle", line: "12d left · 842 people", match: ["nvd", "nvidia", "earn"] }, { id: "fed-decision", emoji: "🏛", name: "Fed Decision", line: "5d left · 1.4K people", match: ["fed", "rate"] }, { id: "uranium", emoji: "⚡", name: "Uranium", line: "17d left · 189 people", match: ["uran", "nuclear", "ceg", "ccj"] }];
export const searchPeople = [{ id: "nvidiabull-marcus", name: "NvidiaBull_Marcus", initial: "N", color: "#7BA05B", belt: "Black", beltColor: "#2E2A21", line: "78% pick accuracy · semis specialist", match: ["nvd", "nvidia", "marcus"] }, { id: "sarah-j", name: "Sarah J.", initial: "S", color: "#D98E73", belt: "Blue", beltColor: "#4E7DA6", line: "87% helpful research · AMZN thesis", match: ["sarah", "amzn", "amazon", "nvd"] }];
export const searchContent = [{ emoji: "💡", title: "Sarah's NVDA valuation thesis", line: "research note · 87% helpful", href: "/club/idea/nuclear-next-decade", match: ["nvd", "nvidia", "valuation", "sarah"] }, { emoji: "📚", title: "Lesson: Understanding Valuation", line: "5 min · your next lesson", href: "/lesson/valuation", match: ["nvd", "valuation", "p/e", "pe", "lesson"] }, { emoji: "📚", title: "Lesson: Diversification basics", line: "6 min · mastered", href: "/learn/path/build-a-portfolio", match: ["divers", "portfolio", "lesson"] }];
