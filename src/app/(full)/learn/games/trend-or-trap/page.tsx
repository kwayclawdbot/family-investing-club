import { MotionProvider } from "@/lib/motion";
import TrendOrTrapGame from "@/components/games/TrendOrTrapGame";

/** Trend or Trap — ported from FTA; rounds come from `game_items`, scores from /api/learn/game. */
export default function TrendOrTrapPage() {
  return <MotionProvider><TrendOrTrapGame /></MotionProvider>;
}
