/** Educational dossier copy per company (artboard 24). Generic fallback for symbols without one. */
export type Dossier = {
  what: string;
  mix: { label: string; pct: number; color: string }[];
  numbers: { key: "pe" | "mcap" | "div" | "range"; label: string; value: string; learn: boolean }[];
  ideaMentions: { count: number; titles: string[] };
};
const BAR = { green: "bg-green-2", orange: "bg-orange", purple: "bg-purple", gold: "bg-gold" };

export const DOSSIERS: Record<string, Dossier> = {
  AAPL: {
    what: "Apple designs the iPhone, Mac and iPad — then earns increasingly from services like the App Store, iCloud and Apple Music that run on those devices.",
    mix: [
      { label: "iPhone", pct: 52, color: BAR.green },
      { label: "Services", pct: 22, color: BAR.orange },
      { label: "Mac + iPad", pct: 15, color: BAR.purple },
      { label: "Wearables", pct: 11, color: BAR.gold },
    ],
    numbers: [
      { key: "pe", label: "P/E RATIO", value: "34.8", learn: true },
      { key: "mcap", label: "MARKET CAP", value: "$3.4T", learn: true },
      { key: "div", label: "DIV YIELD", value: "0.4%", learn: true },
      { key: "range", label: "52-WK RANGE", value: "$164–231", learn: false },
    ],
    ideaMentions: { count: 2, titles: ["Services flywheel", "Dividend growers"] },
  },
  COST: {
    what: "Costco sells groceries and household goods at thin margins — the real profit is the yearly membership fee that 93% of members keep renewing.",
    mix: [
      { label: "Warehouse", pct: 84, color: BAR.green },
      { label: "Membership", pct: 2, color: BAR.orange },
      { label: "Gas & other", pct: 14, color: BAR.purple },
    ],
    numbers: [
      { key: "pe", label: "P/E RATIO", value: "52.1", learn: true },
      { key: "mcap", label: "MARKET CAP", value: "$482B", learn: true },
      { key: "div", label: "DIV YIELD", value: "0.5%", learn: true },
      { key: "range", label: "52-WK RANGE", value: "$870–1,090", learn: false },
    ],
    ideaMentions: { count: 1, titles: ["Recession-proof memberships"] },
  },
  NVDA: {
    what: "NVIDIA designs the chips that power AI data centers and gaming — and sells the software that keeps customers on them.",
    mix: [
      { label: "Data center", pct: 78, color: BAR.green },
      { label: "Gaming", pct: 13, color: BAR.orange },
      { label: "Other", pct: 9, color: BAR.purple },
    ],
    numbers: [
      { key: "pe", label: "P/E RATIO", value: "48.9", learn: true },
      { key: "mcap", label: "MARKET CAP", value: "$4.4T", learn: true },
      { key: "div", label: "DIV YIELD", value: "0.03%", learn: true },
      { key: "range", label: "52-WK RANGE", value: "$86–190", learn: false },
    ],
    ideaMentions: { count: 2, titles: ["AI infrastructure", "Priced for perfection?"] },
  },
};

export function dossierFor(symbol: string, name: string, metricValues: Record<string, string>): Dossier {
  const d = DOSSIERS[symbol.toUpperCase()];
  if (d) return d;
  const first = name.split(" ")[0].replace(/,$/, "");
  return {
    what: `${first} is a business we're still writing the plain-language story for. Tap the numbers to learn what they mean, and ask Kai how it makes money.`,
    mix: [],
    numbers: [
      { key: "pe", label: "P/E RATIO", value: metricValues.pe ?? "—", learn: true },
      { key: "mcap", label: "MARKET CAP", value: metricValues.mcap ?? "—", learn: true },
      { key: "div", label: "DIV YIELD", value: metricValues.div ?? "—", learn: true },
      { key: "range", label: "52-WK RANGE", value: metricValues.range ?? "—", learn: false },
    ],
    ideaMentions: { count: 0, titles: [] },
  };
}
