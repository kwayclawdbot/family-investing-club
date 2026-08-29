/** The practice-game catalog — authored content. Scores are real (`game_scores`); see live/practice.ts. */
import type { Game } from "@/lib/types";

export const GAMES: Game[] = [
  { id: "term-match", title: "Term Match", kind: "recognition", skill: "Vocabulary", level: "Explorer+", minutes: 3, blurb: "Match the term to its plain-language meaning before the clock runs out.", emoji: "🧩" },
  { id: "higher-lower", title: "Higher or Lower", kind: "chart", skill: "Chart reading", level: "Investor", minutes: 4, blurb: "See a chart, call the next move, learn why.", emoji: "📈" },
  { id: "budget-builder", title: "Budget Builder", kind: "decision", skill: "Money basics", level: "Explorer+", minutes: 5, blurb: "Split a paycheck across needs, wants and investing.", emoji: "🧮" },
  { id: "risk-or-reward", title: "Risk or Reward?", kind: "decision", skill: "Risk & return", level: "Builder+", minutes: 4, blurb: "Rank investments from safest to riskiest.", emoji: "⚖️" },
  { id: "family-brand-hunt", title: "Brand Hunt", kind: "family", skill: "Ownership", level: "All", minutes: 10, blurb: "Which companies made the things in your kitchen? Play together.", emoji: "🏠" },
  { id: "diversify-it", title: "Diversify It", kind: "decision", skill: "Diversification", level: "Investor", minutes: 5, blurb: "Build a portfolio that survives a bad year.", emoji: "🧺" },
];
export const gameById = (id: string) => GAMES.find((g) => g.id === id);
