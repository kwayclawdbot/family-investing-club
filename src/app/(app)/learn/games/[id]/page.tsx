import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { TermMatch } from "@/components/learn/TermMatch";
import { Card, ButtonLink, Tag, Button } from "@/components/ui";
import { getGame, termPairs } from "@/lib/data-live";
import { ValuationDrill } from "@/components/practice/ValuationDrill";

export default async function GamePage(props: PageProps<"/learn/games/[id]">) {
  const { id } = await props.params;
  if (id === "valuation") return <div className="-mx-[18px]"><TopBar backHref="/practice" title="Cheap or expensive?" /><div className="px-[18px]"><ValuationDrill /></div></div>;
  const game = await getGame(id);
  if (!game) notFound();

  if (game.id === "term-match") {
    return (
      <div className="-mx-[18px]">
        <TopBar backHref="/learn/games" title={game.title} />
        <div className="px-[18px]"><TermMatch pairs={termPairs} gameId={game.id} /></div>
      </div>
    );
  }

  const playable = game.kind === "recognition" || game.kind === "chart";
  const playHref = game.kind === "chart" ? "/learn/chart-practice" : "/learn/games/term-match";
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/learn/games" />
      <div className="px-[18px] pb-6">
        <div className="w-[72px] h-[72px] rounded-[20px] bg-green-tint flex items-center justify-center text-[36px]" aria-hidden>{game.emoji}</div>
        <h1 className="mt-4 text-[24px] font-black text-ink leading-tight">{game.title}</h1>
        <p className="mt-2 text-[14px] font-bold text-ink-3 leading-[1.5]">{game.blurb}</p>
        <div className="flex gap-2 mt-3">
          <Tag>{game.skill}</Tag><Tag tone="muted">{game.level}</Tag><Tag tone="muted">{game.minutes} min</Tag>
        </div>
        <Card className="mt-5">
          <div className="text-[11px] font-extrabold text-green uppercase tracking-[0.3px]">What you&apos;ll practice</div>
          <ul className="mt-2 flex flex-col gap-2 text-[13.5px] font-bold text-ink">
            <li>• Recognising <b>{game.skill.toLowerCase()}</b> in real situations</li>
            <li>• Quick, low-stakes decisions with instant feedback</li>
            <li>• Earning XP for skill — never for speed of trading</li>
          </ul>
        </Card>
        {game.best !== undefined && <p className="mt-3 text-[12px] font-extrabold text-gold">★ Your best: {game.best}</p>}
        <div className="mt-6">
          {playable ? (
            <ButtonLink href={playHref} full>Play</ButtonLink>
          ) : (
            <>
              <Button full disabled>Play</Button>
              <p className="mt-2 text-center text-[12px] font-bold text-ink-3">Coming in a later release — this drill needs the FTA games engine.</p>
            </>
          )}
          <Link href="/learn/games" className="block mt-3 text-center text-[13px] font-extrabold text-green">All games</Link>
        </div>
      </div>
    </div>
  );
}
