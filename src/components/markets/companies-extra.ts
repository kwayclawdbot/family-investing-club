/**
 * Presentation-layer fallbacks for symbols the club talks about but the market fixture doesn't carry yet
 * (COST, DIS, CEG …). `costcoQuote` comes from the data seam; the rest are labelled sample quotes.
 * Replace with the FTA market-data engine — never edit `src/lib` from this lane.
 */
import type { Company } from "@/lib/types";
import { costcoQuote } from "@/lib/data";

const wave = (n: number, start: number, end: number, vol: number, seed = 1) => {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280 - 0.5) * vol;
  return Array.from({ length: n }, (_, i) => +(start + ((end - start) * i) / (n - 1) + rnd()).toFixed(2));
};
const mk = (symbol: string, name: string, price: number, changePct: number, seed: number, understand: Company["understand"]): Company => {
  const change = +((price * changePct) / 100).toFixed(2);
  const s = (k: number, v: number) => wave(40, price / (1 + (k * changePct) / 100), price, v, seed + k);
  return {
    symbol, name, price, change, changePct,
    series: { "1D": s(1, price * 0.004), "1W": s(2, price * 0.01), "1M": s(4, price * 0.02), "3M": s(8, price * 0.03), "1Y": s(20, price * 0.05), "5Y": s(60, price * 0.08) },
    understand,
  };
};

export const EXTRA: Record<string, Company> = {
  COST: mk("COST", "Costco Wholesale", costcoQuote.price, costcoQuote.changePct, 101, [
    { q: "How does Costco make money?" }, { q: "Why do memberships matter so much?", concept: "MOAT" }, { q: "Is Costco expensive?", concept: "P/E RATIO" },
  ]),
  DIS: mk("DIS", "Walt Disney Co.", 112.6, 1.1, 111, [{ q: "How does Disney make money?" }, { q: "Why did DIS move today?" }]),
  CEG: mk("CEG", "Constellation Energy", 312.4, 2.1, 121, [{ q: "How does a power company make money?" }, { q: "What is baseload power?", concept: "ENERGY" }]),
  VST: mk("VST", "Vistra Corp.", 168.9, 1.9, 131, [{ q: "How does Vistra make money?" }]),
  CCJ: mk("CCJ", "Cameco Corp.", 54.2, 1.4, 141, [{ q: "Why does uranium supply matter?" }]),
  SMR: mk("SMR", "NuScale Power", 22.7, -0.8, 151, [{ q: "What is a small modular reactor?" }]),
  AMZN: mk("AMZN", "Amazon.com", 214.3, 0.8, 161, [{ q: "How does Amazon make money?" }, { q: "What is AWS?" }]),
};

/** Company from the data seam, else a sample fallback. */
export function resolveCompany(seamCompany: Company | undefined, symbol: string): Company | undefined {
  return seamCompany ?? EXTRA[symbol.toUpperCase()];
}
export const isSampleQuote = (symbol: string) => symbol.toUpperCase() in EXTRA;

/** Who in the club added a company to the research list (artboard 25). Presentation-only until lists carry `addedBy`. */
export const ADDED_BY: Record<string, string> = { NVDA: "Andwele", KO: "Dad", DIS: "Arielle", COST: "Mom", AAPL: "Arielle", CEG: "Dad" };
export const ADDED_REASON: Record<string, string> = {
  NVDA: "their chips are in everything AI",
  KO: "63 years of raising dividends",
  DIS: "we watch everything they make",
  COST: "our cart is their revenue",
};
