export const money = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const signed = (n: number, digits = 2) => `${n < 0 ? "−" : "+"}${money(Math.abs(n), digits)}`;
export const pct = (n: number, digits = 1) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(digits)}%`;
export const tileTone = (symbol: string) => {
  const tones = [
    "bg-line-2 text-ink-2",
    "bg-green-tint text-green",
    "bg-orange-tint text-orange-2",
    "bg-purple-tint text-purple-2",
  ];
  return tones[symbol.charCodeAt(0) % tones.length];
};

/** Data-trust label for a price: Polygon on this tier is ~15 min delayed; fixtures are samples. */
export const freshnessLabel = (f?: "delayed" | "eod" | "sample" | null) => (f === "delayed" ? "Delayed 15m" : f === "eod" ? "End of day" : "Sample");
