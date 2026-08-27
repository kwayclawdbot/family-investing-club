import { TopBar } from "@/components/shell/TopBar";
import { GamesHub } from "@/components/learn/GamesHub";
import { getGames } from "@/lib/data";

export default async function GamesPage() {
  const games = await getGames();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/learn" title="Games" />
      <div className="px-[18px] pb-6">
        <h1 className="text-[21px] font-black text-ink mt-1">Practice by playing</h1>
        <p className="text-[13px] font-bold text-ink-3 mt-1">Short drills that build real skill — sophisticated enough for adults, fun enough for kids.</p>
        <GamesHub games={games} />
      </div>
    </div>
  );
}
