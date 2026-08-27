import "server-only";

/**
 * Optional bridge to the Polygon market layer (built by another lane). Resolved at runtime so this
 * module compiles whether or not `src/lib/market/quote.ts` exists yet. Replace the dynamic import
 * with `import { getQuote } from "@/lib/market/quote"` once that file lands.
 */
export type Quote = { price: number; change: number; changePct: number; asOf?: string; freshness?: string };

let loader: Promise<((symbol: string) => Promise<Quote | null>) | null> | null = null;

async function load() {
  if (!loader) {
    loader = (async () => {
      try {
        const path = "@/lib/market/" + "quote"; // variable path: not resolved at build time
        const mod = (await import(path)) as { getQuote?: (s: string) => Promise<Quote | null> };
        return typeof mod.getQuote === "function" ? mod.getQuote : null;
      } catch {
        return null;
      }
    })();
  }
  return loader;
}

export async function quoteSafe(symbol: string): Promise<Quote | null> {
  try {
    const fn = await load();
    return fn ? await fn(symbol) : null;
  } catch {
    return null;
  }
}

export async function quotesSafe(symbols: string[]): Promise<Record<string, Quote>> {
  const out: Record<string, Quote> = {};
  await Promise.all(symbols.map(async (s) => { const q = await quoteSafe(s); if (q) out[s.toUpperCase()] = q; }));
  return out;
}
