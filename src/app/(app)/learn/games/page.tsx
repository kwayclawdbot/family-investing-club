import { GamesHub } from "@/components/learn/GamesHub";
import { XpPill } from "@/components/learn/XpPill";
import { getGames, getUser } from "@/lib/data";

/** Artboard 17 — Games Hub / Practice Arcade. */
export default async function GamesPage() {
  const [games, user] = await Promise.all([getGames(), getUser()]);
  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Practice Arcade</h1>
        <XpPill xp={user.weekXp} />
      </div>
      <GamesHub games={games} />
      <p className="mt-4 text-center text-[11.5px] font-bold text-ink-4">Short drills that build real skill · sophisticated enough for adults, fun enough for kids</p>
    </div>
  );
}
