/** Prototype v3 — official club picks + decision record rows. */
export const officialPicks = {
  count: 12, open: 8, ytdPct: 14.6, benchPct: 6.2, ranges: ["YTD", "1M", "3M", "ALL"], markers: "● $CEG added · ● NVDA trimmed",
  tiles: [["75%", "POSITIVE PICKS", "9 of 12"], ["+8.4%", "VS BENCHMARK", "avg per pick"], ["3.1y", "AVG HORIZON", "long-term club"]],
  rows: [
    { symbol: "CEG", name: "Constellation", stance: "BUY", line: "added Aug 24 · passed 4-0", pct: 18 },
    { symbol: "NVDA", name: "Nvidia", stance: "BUY", line: "added Mar 14 · trimmed Jul 12", pct: 26 },
    { symbol: "VOO", name: "Vanguard S&P 500", stance: "CORE", line: "added Jan 8 · 40% anchor", pct: 9 },
    { symbol: "COST", name: "Costco", stance: "WATCH", line: "proposal pending · Mom researching", pct: 2 },
    { symbol: "KO", name: "Coca-Cola", stance: "BUY", line: "added Jun 2 · dividend sleeve", pct: -2 },
  ],
  footnote: "v1 tracks the club's official picks only — the ones the club voted in. Individual member tracking comes later.",
};
export const decisionRows = [
  { symbol: "CEG", vote: "YES", what: "add 4%", date: "Aug 24", result: "passed 4-0 · thesis: AI baseload power", pct: "+18%", verdict: "✓ aged well" },
  { symbol: "TSLA", vote: "NO", what: "rejected", date: "Aug 2", result: "rejected 1-3 · too volatile for horizon", pct: "−9% since", verdict: "✓ right call" },
  { symbol: "NVDA", vote: "TRIM", what: "15→12%", date: "Jul 12", result: "passed 3-1 · concentration risk", pct: "±0%", verdict: "— too early" },
];
export const kaiClubSummary = "Today: $CEG news strengthens the thesis · vote closes 8h · 1 research due Thu.";
