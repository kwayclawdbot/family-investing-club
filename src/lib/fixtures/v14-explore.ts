/** Prototype v3 — Discover stream, My Performance history, scenarios (lane fixtures; import directly). */
export type DiscoverCard = {
  symbol: string; name: string; story: string; tag: string; tone: "green" | "orange" | "gold" | "purple";
  metric: "today" | "ytd"; fallbackPct: number; href: string; kind: "stock" | "theme";
};
export const discoverCards: DiscoverCard[] = [
  { symbol: "NVDA", name: "Nvidia", story: "Chips behind every AI data center. Earnings Wednesday.", tag: "4 IN YOUR\nCLUB", tone: "green", metric: "today", fallbackPct: 4.2, href: "/discover/NVDA", kind: "stock" },
  { symbol: "COST", name: "Costco", story: "Membership renewals are the moat. 71% of FIC says buy.", tag: "MOM IS\nRESEARCHING", tone: "orange", metric: "today", fallbackPct: 0.6, href: "/discover/COST", kind: "stock" },
  { symbol: "CEG", name: "Constellation", story: "Largest US nuclear fleet — your club already holds 8%.", tag: "⚡ NUCLEAR\nTHEME", tone: "gold", metric: "ytd", fallbackPct: 18, href: "/theme/nuclear-energy", kind: "theme" },
  { symbol: "DIS", name: "Disney", story: "The stock kids actually know. Parks + streaming turnaround.", tag: "POPULAR WITH\nFAMILIES", tone: "purple", metric: "today", fallbackPct: -0.2, href: "/discover/DIS", kind: "stock" },
];
export const trendingTheme = { id: "nuclear-energy", emoji: "⚡", title: "Nuclear Energy", sub: "basket +34% 1Y · 1.2K researching" };

export const pickHistoryV3 = [
  { id: "andwele-nvda", symbol: "NVDA", line: "BUY · Mar 14 · 3y · open", sub: "●●●○○ · ✓ verified · shared to club", pct: 26 },
  { id: "mom-cost", symbol: "COST", line: "BUY · Aug 20 · 5y · open", sub: "club discussing · Sarah replied", pct: 2 },
  { id: "ceg-nuclear", symbol: "CEG", line: "BUY · Jul 2 · 5y · open", sub: "from ⚡ Nuclear idea · club holds 8%", pct: 18 },
  { id: "ko", symbol: "KO", line: "BUY · Jun 2 · resolved ✕", sub: "thesis review written · lesson linked", pct: -2.1 },
];

export const earningsSurprise = {
  id: "earnings-surprise", emoji: "💰", title: "Earnings surprise — react in real time", symbol: "NVDA",
  when: "Wednesday · 4:30 PM ET", blurb: "When $NVDA reports, this scenario opens with the real numbers: revenue vs. the whisper, guidance, and the after-hours move. You'll decide — hold, trim, add — before the market opens Thursday, then see what actually happened.",
  steps: ["Wed 4:30 PM — the report lands", "You get 3 choices with Simbot's coaching", "Thursday open — outcome + what you'd have learned"],
};
