/**
 * Themes — curated editorial: which companies belong to an idea, and the plain-language case on both
 * sides. Content, like the curriculum, not fake data: every number a theme page shows (basket return,
 * benchmark, FIC consensus, how many are researching it) is computed live from real bars and real picks.
 */
export type ThemeCompany = { symbol: string; name: string; line: string };
export type Theme = { id: string; emoji: string; name: string; companies: ThemeCompany[]; why: string; bull: string; bear: string };

export const THEMES: Record<string, Theme> = {
  "nuclear-energy": {
    id: "nuclear-energy", emoji: "⚡", name: "Nuclear Energy",
    companies: [
      { symbol: "CEG", name: "Constellation", line: "largest US nuclear fleet" },
      { symbol: "VST", name: "Vistra", line: "fastest-growing operator" },
      { symbol: "CCJ", name: "Cameco", line: "uranium supply side" },
      { symbol: "SMR", name: "NuScale", line: "small modular reactors · speculative" },
      { symbol: "OKLO", name: "Oklo", line: "microreactors · pre-revenue" },
    ],
    why: "AI data centers need massive, reliable, carbon-free power — and tech giants are signing decade-long nuclear supply deals. New reactor approvals are accelerating.",
    bull: "Demand locked in for decades; bipartisan support.",
    bear: "Reactors take a decade; costs overrun; uranium supply.",
  },
  "ai-infrastructure": {
    id: "ai-infrastructure", emoji: "🤖", name: "AI Infrastructure",
    companies: [
      { symbol: "NVDA", name: "Nvidia", line: "the chips in nearly every AI data center" },
      { symbol: "MSFT", name: "Microsoft", line: "cloud capacity + the OpenAI partnership" },
      { symbol: "AMZN", name: "Amazon", line: "AWS — the biggest cloud landlord" },
    ],
    why: "Training and running AI models takes chips, data centers and power. The companies selling that capacity get paid whether or not any one AI product wins.",
    bull: "Spending commitments are multi-year and already contracted.",
    bear: "Customers are designing their own chips; the spend can pause.",
  },
  "dividend-starters": {
    id: "dividend-starters", emoji: "💵", name: "Dividend Starters",
    companies: [
      { symbol: "KO", name: "Coca-Cola", line: "raised its dividend for six decades" },
      { symbol: "COST", name: "Costco", line: "membership renewals fund the payout" },
      { symbol: "VOO", name: "Vanguard S&P 500", line: "the whole market, dividends included" },
    ],
    why: "A dividend is cash the company sends you for owning it — the simplest way to see a business share its profits, and a good first lesson in getting paid to wait.",
    bull: "Cash returns are real money, paid whatever the price does.",
    bear: "A high yield can mean the market expects trouble.",
  },
};

export const themeIds = Object.keys(THEMES);
export const themeOf = (id: string) => THEMES[id];
/** The themes a symbol belongs to — used to tie a company page back to the idea it sits in. */
export const themesFor = (symbol: string) => Object.values(THEMES).filter((t) => t.companies.some((c) => c.symbol === symbol.toUpperCase()));
