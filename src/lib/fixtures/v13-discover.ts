/** Round 8 — Clickable Prototype v2: Discover · Screener · Theme · News · Company lane fixtures. */
export const BRAND: Record<string, string> = {
  COST: "#E31837", DIS: "#113CCF", VOO: "#96151D", AAPL: "#555555", MSFT: "#0078D4", NVDA: "#76B900", TSLA: "#CC0000",
  CEG: "#0057B8", VST: "#00A9E0", CCJ: "#5C6670", SMR: "#1B7A43", AMZN: "#FF9900", KO: "#F40009", QQQ: "#0B3D91", GOOGL: "#4285F4",
};
export const brandOf = (s: string) => BRAND[s.toUpperCase()] ?? "#3A6B3E";

export const popularFamilies = [
  { symbol: "COST", name: "Costco", line: "owned by 41% of family clubs · 🟢 71% Buy" },
  { symbol: "DIS", name: "Disney", line: 'most-picked "company kids know" this month' },
];
export const mostOwned = { symbols: ["VOO", "AAPL", "MSFT"], more: 9 };
export const mostDiscussed = { symbols: ["NVDA", "COST", "TSLA"], more: 31 };
export const topIdea = { id: "nuclear-energy", title: "Nuclear: The Next Decade", following: 125, symbols: ["CEG", "VST", "CCJ", "SMR"], line: "basket +34% 1Y · 🟢 61% Buy" };
export const earningsWeek = [
  { symbol: "NVDA", when: "WED 4:30", note: "club holds 12%" },
  { symbol: "COST", when: "THU 4:15", note: "open pick" },
  { symbol: "DIS", when: "THU 4:05", note: "watchlist" },
];

export type ThemeCompany = { symbol: string; name: string; line: string; pct1y: number };
export type Theme = {
  id: string; emoji: string; name: string; companies: ThemeCompany[]; researching: string; basketPct: number; benchmarkPct: number;
  why: string; bull: string; bear: string; fic: { buy: number; watch: number; pass: number; picks: number }; idea: { title: string; following: number; href: string };
  series: number[];
};
export const themes: Record<string, Theme> = {
  "nuclear-energy": {
    id: "nuclear-energy", emoji: "⚡", name: "Nuclear Energy", researching: "1.2K", basketPct: 34.2, benchmarkPct: 11.4,
    companies: [
      { symbol: "CEG", name: "Constellation", line: "largest US nuclear fleet · club owns 8%", pct1y: 18 },
      { symbol: "VST", name: "Vistra", line: "fastest-growing operator", pct1y: 42 },
      { symbol: "CCJ", name: "Cameco", line: "uranium supply side", pct1y: 21 },
      { symbol: "SMR", name: "NuScale", line: "small modular reactors · speculative", pct1y: -8 },
      { symbol: "OKLO", name: "Oklo", line: "microreactors · pre-revenue", pct1y: 12 },
    ],
    why: "AI data centers need massive, reliable, carbon-free power — and tech giants are signing decade-long nuclear supply deals. New reactor approvals are accelerating.",
    bull: "Demand locked in for decades; bipartisan support.",
    bear: "Reactors take a decade; costs overrun; uranium supply.",
    fic: { buy: 61, watch: 30, pass: 9, picks: 3204 },
    idea: { title: 'Sarah’s idea "Nuclear: The Next Decade"', following: 125, href: "/club/idea/nuclear-next-decade" },
    series: [40, 44, 42, 48, 52, 50, 58, 55, 63, 70, 68, 76],
  },
};

export type ScreenerRow = {
  symbol: string; name: string; line: string; sector: string; pe: number; fic: { buy: number; watch: number }; ytd: number;
  dividend: boolean; familyOwned: boolean; cap: "mega" | "large" | "mid"; theme?: string; fallbackPrice: number; fallbackPct: number;
};
export const screenerRows: ScreenerRow[] = [
  { symbol: "COST", name: "Costco", line: "owned by 41% of family clubs · moat: renewals", sector: "Consumer", pe: 38, fic: { buy: 71, watch: 20 }, ytd: 12, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 1024, fallbackPct: 0.6 },
  { symbol: "NVDA", name: "Nvidia", line: "4 in your club follow · earnings Wed", sector: "Technology", pe: 60, fic: { buy: 68, watch: 23 }, ytd: 31, dividend: false, familyOwned: true, cap: "mega", fallbackPrice: 1204, fallbackPct: 4.2 },
  { symbol: "CEG", name: "Constellation", line: "riding the ⚡ Nuclear theme · club holds 8%", sector: "Energy", pe: 29, fic: { buy: 64, watch: 27 }, ytd: 18, dividend: true, familyOwned: true, cap: "large", theme: "nuclear-energy", fallbackPrice: 312, fallbackPct: 2.1 },
  { symbol: "VST", name: "Vistra", line: "fastest grower in ⚡ Nuclear", sector: "Energy", pe: 24, fic: { buy: 61, watch: 30 }, ytd: 42, dividend: true, familyOwned: false, cap: "large", theme: "nuclear-energy", fallbackPrice: 186, fallbackPct: 1.4 },
  { symbol: "DIS", name: "Disney", line: 'most-picked "kids know it" stock', sector: "Consumer", pe: 22, fic: { buy: 51, watch: 34 }, ytd: 4, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 124, fallbackPct: -0.2 },
  { symbol: "KO", name: "Coca-Cola", line: "most-held dividend starter · 3.1% yield", sector: "Consumer", pe: 24, fic: { buy: 48, watch: 38 }, ytd: -2, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 70, fallbackPct: -0.4 },
  { symbol: "AAPL", name: "Apple", line: "3 in your club watch it · services moat", sector: "Technology", pe: 31, fic: { buy: 61, watch: 31 }, ytd: 9, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 229, fallbackPct: 1.7 },
  { symbol: "MSFT", name: "Microsoft", line: "most-owned verified · cloud + AI", sector: "Technology", pe: 34, fic: { buy: 66, watch: 26 }, ytd: 14, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 415, fallbackPct: 0.9 },
  { symbol: "VOO", name: "S&P 500 ETF", line: "the most-held first position across FIC", sector: "ETF", pe: 24, fic: { buy: 84, watch: 14 }, ytd: 9, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 612, fallbackPct: 0.9 },
  { symbol: "AMZN", name: "Amazon", line: "Sarah’s thesis · ads are the quiet business", sector: "Consumer", pe: 41, fic: { buy: 63, watch: 28 }, ytd: 11, dividend: false, familyOwned: false, cap: "mega", fallbackPrice: 218, fallbackPct: -0.8 },
  { symbol: "CCJ", name: "Cameco", line: "uranium supply · ⚡ Nuclear", sector: "Energy", pe: 52, fic: { buy: 57, watch: 33 }, ytd: 21, dividend: true, familyOwned: false, cap: "large", theme: "nuclear-energy", fallbackPrice: 58, fallbackPct: 1.1 },
  { symbol: "SMR", name: "NuScale", line: "small modular reactors · speculative", sector: "Energy", pe: 0, fic: { buy: 44, watch: 36 }, ytd: -8, dividend: false, familyOwned: false, cap: "mid", theme: "nuclear-energy", fallbackPrice: 19, fallbackPct: -1.2 },
  { symbol: "TSLA", name: "Tesla", line: "most-discussed · 31 clubs debating", sector: "Consumer", pe: 88, fic: { buy: 39, watch: 35 }, ytd: -6, dividend: false, familyOwned: false, cap: "mega", fallbackPrice: 245, fallbackPct: -1.9 },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", line: "growth starter · 3 clubs like yours own it", sector: "ETF", pe: 30, fic: { buy: 72, watch: 22 }, ytd: 13, dividend: true, familyOwned: true, cap: "mega", fallbackPrice: 470, fallbackPct: 1.2 },
];

export type NewsFixture = { id: string; symbol: string | null; source: string; ago: string; pct?: number; headline: string; why?: string; whyTone?: "green" | "red"; circle?: { id: string; label: string }; tab: "mine" | "club" | "markets" };
export const newsItems: NewsFixture[] = [
  { id: "msft-nvda-deal", symbol: "NVDA", source: "Reuters", ago: "2h", pct: 4.2, headline: "Microsoft $MSFT signs $10B multi-year chip supply deal with $NVDA", why: "your club holds 12% $NVDA — this locks in the data-center demand your thesis depends on.", whyTone: "green", tab: "mine" },
  { id: "amzn-chips", symbol: "AMZN", source: "Bloomberg", ago: "1d", pct: -0.8, headline: "Amazon $AMZN accelerates its in-house AI chip program", why: "the bear case on $NVDA in action — big customers building alternatives.", whyTone: "red", tab: "mine" },
  { id: "fed-wed", symbol: null, source: "FIC Desk", ago: "3h", headline: "Fed decision Wednesday — what a cut means for your portfolio", circle: { id: "fed-decision", label: "🏛 Discuss in the Fed Decision circle · 1.4K in ›" }, tab: "markets" },
  { id: "cost-renewals", symbol: "COST", source: "WSJ", ago: "5h", pct: 0.6, headline: "Costco $COST membership renewals hold at 93% as fee hike lands", why: "Mom’s research thesis — renewals are the moat — just got its first data point.", whyTone: "green", tab: "club" },
  { id: "ceg-contract", symbol: "CEG", source: "Reuters", ago: "8h", pct: 2.1, headline: "Constellation $CEG signs 20-year nuclear supply deal with a hyperscaler", why: "the open CEG vote is about exactly this — decade-long demand for baseload power.", whyTone: "green", tab: "club" },
  { id: "jobs", symbol: null, source: "FIC Desk", ago: "1d", headline: "Jobs report cooler than expected — why bond yields fell", circle: { id: "fed-decision", label: "🏛 Discuss in the Fed Decision circle ›" }, tab: "markets" },
];

export type CompanyExtra = { sector: string; newsLine?: string; earnings?: string; circleId?: string; rank?: string; mix: { label: string; pct: number; color: string }[]; mixYear: string; understand: string[] };
export const companyExtras: Record<string, CompanyExtra> = {
  NVDA: { sector: "Semiconductors", newsLine: "$MSFT $10B chip deal · $AMZN designing rival chip", earnings: "📊 earnings Wed · circle live", circleId: "nvda-earnings", rank: "#1 in semis", mixYear: "FY25", mix: [{ label: "Data center", pct: 78, color: "#4C8C4A" }, { label: "Gaming", pct: 9, color: "#E58234" }, { label: "Other", pct: 13, color: "#E9C46A" }], understand: ["Why did NVDA move today?", "How does Nvidia make money?", "Is NVDA expensive?", "What would $100 ten years ago be worth?"] },
  AAPL: { sector: "Consumer electronics", rank: "#1 by market cap", mixYear: "FY25", mix: [{ label: "iPhone", pct: 52, color: "#4C8C4A" }, { label: "Services", pct: 22, color: "#E58234" }, { label: "Mac · iPad · Wearables", pct: 26, color: "#E9C46A" }], understand: ["Why did AAPL move today?", "How does Apple make money?", "Is Apple expensive?", "What would $100 ten years ago be worth?"] },
  COST: { sector: "Retail · warehouse clubs", earnings: "📊 earnings Thu 4:15", rank: "#2 US retailer", mixYear: "FY25", mix: [{ label: "Merchandise", pct: 98, color: "#4C8C4A" }, { label: "Membership fees", pct: 2, color: "#E58234" }], understand: ["Why did COST move today?", "How does Costco make money?", "Is Costco expensive?", "What would $100 ten years ago be worth?"] },
  CEG: { sector: "Utilities · nuclear", rank: "largest US nuclear fleet", mixYear: "FY25", mix: [{ label: "Nuclear generation", pct: 68, color: "#4C8C4A" }, { label: "Retail power", pct: 24, color: "#E58234" }, { label: "Other", pct: 8, color: "#E9C46A" }], understand: ["Why did CEG move today?", "How does Constellation make money?", "Is CEG expensive?", "What is baseload power?"] },
};
export const genericExtra = (name: string): CompanyExtra => ({ sector: "—", mixYear: "FY", mix: [{ label: "Revenue mix arrives with fundamentals", pct: 100, color: "#E4DAC4" }], understand: [`Why did it move today?`, `How does ${name} make money?`, "Is it expensive?", "What would $100 ten years ago be worth?"] });
