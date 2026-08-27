/** The companies the club talks about — names + beginner "Understand X" prompts (data, not market). */
import type { Company } from "@/lib/types";

export type UniverseEntry = { symbol: string; name: string; understand: Company["understand"]; kind: "stock" | "etf" };

export const UNIVERSE: UniverseEntry[] = [
  { symbol: "AAPL", name: "Apple Inc.", kind: "stock", understand: [{ q: "Why did AAPL move today?" }, { q: "How does Apple make money?" }, { q: "Is Apple expensive?", concept: "P/E RATIO" }, { q: "What would $100 invested 10 years ago be worth?" }] },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", kind: "etf", understand: [{ q: "What is an ETF?", concept: "ETF" }, { q: "What's inside VOO?" }, { q: "Why do people call this 'the market'?" }] },
  { symbol: "KO", name: "Coca-Cola Co.", kind: "stock", understand: [{ q: "What is a dividend?", concept: "DIVIDEND" }, { q: "How does Coca-Cola make money?" }, { q: "Why is KO called a 'defensive' stock?" }] },
  { symbol: "NVDA", name: "NVIDIA Corp.", kind: "stock", understand: [{ q: "Why did NVIDIA move today?" }, { q: "How does NVIDIA make money?" }, { q: "Is NVIDIA expensive?", concept: "P/E RATIO" }] },
  { symbol: "COST", name: "Costco Wholesale", kind: "stock", understand: [{ q: "How does Costco make money?" }, { q: "Why do memberships matter so much?", concept: "MOAT" }, { q: "Is Costco expensive?", concept: "P/E RATIO" }] },
  { symbol: "CEG", name: "Constellation Energy", kind: "stock", understand: [{ q: "How does a power company make money?" }, { q: "What is baseload power?", concept: "ENERGY" }] },
  { symbol: "DIS", name: "Walt Disney Co.", kind: "stock", understand: [{ q: "How does Disney make money?" }, { q: "Why did DIS move today?" }] },
  { symbol: "AMZN", name: "Amazon.com", kind: "stock", understand: [{ q: "How does Amazon make money?" }, { q: "What is AWS?" }] },
  { symbol: "MSFT", name: "Microsoft Corp.", kind: "stock", understand: [{ q: "How does Microsoft make money?" }, { q: "What is cloud computing?" }] },
  { symbol: "VST", name: "Vistra Corp.", kind: "stock", understand: [{ q: "How does Vistra make money?" }] },
  { symbol: "CCJ", name: "Cameco Corp.", kind: "stock", understand: [{ q: "Why does uranium supply matter?" }] },
  { symbol: "SMR", name: "NuScale Power", kind: "stock", understand: [{ q: "What is a small modular reactor?" }] },
  { symbol: "TSLA", name: "Tesla Inc.", kind: "stock", understand: [{ q: "How does Tesla make money?" }, { q: "Why is TSLA so volatile?", concept: "VOLATILITY" }] },
  { symbol: "QQQ", name: "Invesco Nasdaq 100 ETF", kind: "etf", understand: [{ q: "What is the Nasdaq 100?", concept: "INDEX" }, { q: "How is QQQ different from VOO?" }] },
];

export const universeEntry = (symbol: string) => UNIVERSE.find((u) => u.symbol === symbol.toUpperCase());
export const defaultUnderstand = (name: string): Company["understand"] => [{ q: `How does ${name} make money?` }, { q: `Why did ${name} move today?` }, { q: `Is ${name} expensive?`, concept: "P/E RATIO" }];
