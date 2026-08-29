/** "Cheap or expensive?" drill rounds — authored teaching content, played at /learn/games/valuation. */
export const valuationRounds = [
  { symbol: "NVDA", name: "Nvidia", pe: 60, sector: "Semiconductors", sectorPe: 28, answer: "expensive", why: "60× vs a sector at 28× — investors are paying for years of growth up front." },
  { symbol: "KO", name: "Coca-Cola", pe: 26, sector: "Beverages", sectorPe: 22, answer: "expensive", why: "A bit above its sector — you pay for the dividend streak and safety." },
  { symbol: "VOO", name: "S&P 500 ETF", pe: 24, sector: "Whole market", sectorPe: 24, answer: "fair", why: "It IS the market — by definition it trades at the market multiple." },
  { symbol: "COST", name: "Costco", pe: 52, sector: "Retail", sectorPe: 20, answer: "expensive", why: "52× for a retailer is steep — the renewal rate is what people are paying for." },
  { symbol: "CEG", name: "Constellation Energy", pe: 31, sector: "Utilities", sectorPe: 18, answer: "expensive", why: "Utilities usually trade near 18×; the AI-power story adds a premium." },
  { symbol: "AAPL", name: "Apple", pe: 34, sector: "Consumer electronics", sectorPe: 30, answer: "fair", why: "Slightly above peers — services growth roughly justifies it." },
] as { symbol: string; name: string; pe: number; sector: string; sectorPe: number; answer: "cheap" | "fair" | "expensive"; why: string }[];
