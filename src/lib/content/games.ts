/** The practice-game catalog. Scores are real (`game_scores`); rounds live in `game_items`. */
import type { Game } from "@/lib/types";

export const GAMES: Game[] = [
  { id: "candle-battle", title: "Candle Battle", kind: "chart", skill: "Chart reading", level: "All", minutes: 4, blurb: "One candle at a time — call whether the bar closes green or red before it forms.", emoji: "🕯" },
  { id: "trend-or-trap", title: "Trend or Trap", kind: "chart", skill: "Trend reading", level: "All", minutes: 4, blurb: "A chart climbs. Is it a real trend, or a trap before the turn?", emoji: "📈" },
  { id: "term-match", title: "Term Match", kind: "recognition", skill: "Vocabulary", level: "All", minutes: 3, blurb: "Match the term to its plain-language meaning before the clock runs out.", emoji: "🧩" },
  { id: "valuation", title: "Cheap or Expensive?", kind: "decision", skill: "Valuation", level: "All", minutes: 3, blurb: "Six real companies, one question: is that price fair for those earnings?", emoji: "🎯" },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
/** The two ported FTA games run on their own routes; everything else uses /learn/games/[id]. */
export const GAME_ROUTES: Record<string, string> = { "candle-battle": "/learn/games/candle-battle", "trend-or-trap": "/learn/games/trend-or-trap" };
export const gameHref = (id: string) => GAME_ROUTES[id] ?? `/learn/games/${id}`;
