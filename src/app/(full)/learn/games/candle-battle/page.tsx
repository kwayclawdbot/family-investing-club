import { MotionProvider } from "@/lib/motion";
import CandleBattleGame from "@/components/games/CandleBattleGame";

/** Candle Battle — ported from FTA; rounds come from `game_items`, scores from /api/learn/game. */
export default function CandleBattlePage() {
  return <MotionProvider><CandleBattleGame /></MotionProvider>;
}
