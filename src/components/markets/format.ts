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
