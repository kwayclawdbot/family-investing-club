import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getMetrics, getNews, getClubFeed, getWatchlist, getClub, getPicks, getProposals, getResearch, clubWatchers } from "@/lib/data";
import { Card } from "@/components/ui";
import { BookmarkIcon, ChevronLeft } from "@/components/ui/icons";
import { CompanyChart } from "@/components/markets/CompanyChart";
import { SymbolActions } from "@/components/markets/SymbolActions";
import { NewsRow } from "@/components/markets/NewsRow";
import { ClubSocialLayer } from "@/components/markets/ClubSocialLayer";
import { DossierCard } from "@/components/markets/Dossier";
import { LearnBridge } from "@/components/markets/LearnBridge";
import { dossierFor } from "@/components/markets/dossier-data";
import { resolveCompany, isSampleQuote } from "@/components/markets/companies-extra";
import { money, pct } from "@/components/markets/format";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function CompanyPage(props: PageProps<"/discover/[symbol]">) {
  const { symbol } = await props.params;
  const c = resolveCompany(await getCompany(symbol), symbol);
  if (!c) notFound();
  const [metrics, news, feed, watchlist, club, picks, proposals, research] = await Promise.all([
    getMetrics(c.symbol), getNews(), getClubFeed(), getWatchlist(), getClub(), getPicks(), getProposals(), getResearch(),
  ]);
  const related = news.filter((n) => n.symbols.includes(c.symbol));
  const idea = feed.flatMap((p) => (p.kind === "idea" ? [p.idea] : [])).find((i) => i.companies.some((x) => x.symbol === c.symbol));
  const up = c.change >= 0;
  const firstName = c.name.split(" ")[0].replace(/,$/, "");
  const watchers = clubWatchers(c.symbol).map((id) => club.members.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const symbolPicks = picks.filter((p) => p.symbol === c.symbol);
  const proposal = proposals.find((p) => p.symbol === c.symbol && p.status === "open");
  const task = research.find((r) => r.symbol === c.symbol && r.status === "open");
  const dossier = dossierFor(c.symbol, c.name, Object.fromEntries(metrics.map((m) => [m.key, m.value])));
  const peMetric = metrics.find((m) => m.key === "pe");

  return (
    <div className="pt-[14px] pb-6">
      {/* Header — artboard 08/24 */}
      <div className="flex items-center justify-between">
        <Link href="/discover" aria-label="Back to Discover" className="text-ink-2"><ChevronLeft /></Link>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-black text-ink">{c.name} · {c.symbol}</span>
          <span className={`text-[12px] font-extrabold ${up ? "text-[#3A8C4A]" : "text-red"}`}>${money(c.price)} {up ? "▲" : "▼"}{Math.abs(c.changePct).toFixed(1)}%</span>
        </div>
        <span className="text-ink-4" aria-hidden><BookmarkIcon size={16} /></span>
      </div>

      {/* Private-club social layer (above the dossier) */}
      <ClubSocialLayer symbol={c.symbol} clubName={club.shortName} watchers={watchers} picks={symbolPicks} proposal={proposal} research={task} />

      {/* The dossier — unchanged */}
      <DossierCard firstName={firstName} dossier={dossier} metrics={metrics} compact />

      {peMetric && <LearnBridge concept="P/E" minutes={4} href={peMetric.lessonHref} />}

      <Link href="/community" className="mt-[10px] flex items-center justify-between rounded-[14px] border border-line bg-card px-[15px] py-[11px]">
        <span className="text-[12px] font-extrabold text-ink-2">
          Public FIC: {dossier.ideaMentions.count + (idea ? 1 : 0)} {dossier.ideaMentions.count + (idea ? 1 : 0) === 1 ? "idea mentions" : "ideas mention"} {c.symbol}
        </span>
        <span className="text-[11px] font-black text-purple-2">View →</span>
      </Link>
      {(idea || dossier.ideaMentions.titles.length > 0) && (
        <Link href={idea ? `/club/idea/${idea.id}` : "/community"} className="mt-[10px] flex items-center gap-[11px] rounded-card border border-line bg-card px-4 py-[13px]">
          <span className="w-[34px] h-[34px] rounded-full bg-coral text-white text-[13px] font-black flex items-center justify-center">{(idea?.author ?? "S")[0]}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[12.5px] font-extrabold text-ink">{idea ? `Club idea: ${idea.title}` : `${dossier.ideaMentions.count} Club ideas mention ${c.symbol}`}</span>
            <span className="block text-[11px] font-bold text-ink-3 truncate">{idea ? `${idea.author} · ${idea.comments} comments` : dossier.ideaMentions.titles.map((t) => `“${t}”`).join(" · ")}</span>
          </span>
          <span className="font-black text-ink-4">›</span>
        </Link>
      )}

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-[15px] font-black text-ink">Price</h2>
        <span className="text-[11px] font-bold text-ink-4">{isSampleQuote(c.symbol) ? "Sample quote" : "Delayed for learning"}</span>
      </div>
      <CompanyChart series={c.series} ranges={["1D", "1W", "1M", "3M", "1Y", "5Y"]} color={up ? "#4C8C4A" : "#C96A57"} />

      <div className="mt-4 flex items-center justify-between mb-2">
        <h2 className="text-[15px] font-black text-ink">In the news</h2>
        <Link href="/discover/news" className="text-[12px] font-extrabold text-green">All news</Link>
      </div>
      <Card className="!py-1 !px-4">
        {related.length === 0 ? (
          <div className="py-5 text-center text-[12.5px] font-bold text-ink-3">No recent stories about {firstName}.</div>
        ) : (
          related.map((n, i) => <NewsRow key={n.id} n={n} last={i === related.length - 1} />)
        )}
      </Card>

      <h2 className="mt-4 text-[15px] font-black text-ink">Understand {firstName}</h2>
      <Card className="mt-2 !py-1 !px-4">
        {c.understand.map((u, i) => (
          <Link key={u.q} href={`/kai?context=${encodeURIComponent(`symbol:${c.symbol}`)}&q=${encodeURIComponent(u.q)}`} className={`flex items-center gap-[10px] py-[11px] ${i < c.understand.length - 1 ? "border-b border-paper-2" : ""}`}>
            <span className="text-orange font-black">+</span>
            <span className="flex-1 text-[13.5px] font-extrabold text-ink">
              {u.q}{u.concept && <span className="ml-1 rounded-[8px] bg-purple-tint px-2 py-[2px] text-[10.5px] font-extrabold text-purple-2">{u.concept}</span>}
            </span>
          </Link>
        ))}
      </Card>

      <SymbolActions symbol={c.symbol} name={c.name} baseWatchlist={watchlist} />
      <p className="mt-4 text-[11px] font-bold text-ink-4 text-center">{pct(c.changePct, 2)} today · sample market data, delayed for learning</p>
      <KaiFab context={`symbol:${c.symbol}`} />
    </div>
  );
}
