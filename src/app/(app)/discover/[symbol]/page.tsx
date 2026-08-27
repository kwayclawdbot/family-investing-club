import { notFound } from "next/navigation";
import { getCompany, getMetrics, getNews, getClubConsensus, getFicConsensus, clubWatchers, getPicks, getClubPortfolio } from "@/lib/data-live";
import { resolveCompany } from "@/components/markets/companies-extra";
import { dossiers, genericDossier } from "@/lib/fixtures/v12-explore";
import { CompanyV12 } from "@/components/markets/v12/CompanyV12";
import { KeyMetrics } from "@/components/markets/KeyMetrics";
import { NewsRow } from "@/components/markets/NewsRow";
import { LineChart } from "@/components/markets/LineChart";

const COLORS: Record<string, string> = { kway: "#4C8C4A", andwele: "#7BA05B", arielle: "#E9B949", mom: "#D98E73", dad: "#B08968" };

/** Company — "Understand this investment" (v12): does → numbers → bull/bear → your club → FIC → sticky Make a Pick. */
export default async function CompanyPage(props: PageProps<"/discover/[symbol]">) {
  const { symbol } = await props.params;
  const sym = symbol.toUpperCase();
  const c = resolveCompany(await getCompany(sym), sym);
  if (!c) notFound();
  const [metrics, news, club, fic, picks, portfolio] = await Promise.all([getMetrics(sym), getNews(), getClubConsensus(sym), getFicConsensus(sym), getPicks(), getClubPortfolio()]);
  const ids = clubWatchers(sym);
  const watchers = ids.map((id) => ({ initial: id[0].toUpperCase(), color: COLORS[id] ?? "#8B7BC7" }));
  const symPicks = picks.filter((p) => p.symbol === sym);
  const holding = portfolio.holdings.find((h) => h.symbol === sym);
  const parts = [...symPicks.slice(0, 2).map((p) => `${p.author} ${p.stance.toUpperCase()}`), holding ? `club model ${holding.weightPct}%` : null, ids.length ? `${ids.length} own it ✓` : null].filter(Boolean);
  const clubLine = parts.length ? parts.join(" · ") : "No picks in your club yet — be the first";
  const d = dossiers[sym] ?? genericDossier(c.name);
  const related = news.filter((n) => n.symbols.includes(sym)).slice(0, 3);
  const more = (
    <div className="flex flex-col gap-3">
      {Object.entries(c.series ?? {}).slice(0, 1).map(([r, s]) => <div key={r}><div className="text-[10px] font-black text-ink-3">{r}</div><LineChart data={s} height={90} color="#3A8C4A" /></div>)}
      <KeyMetrics metrics={metrics} />
      {related.length > 0 && <div className="bg-card border border-line rounded-[14px] px-3">{related.map((n, i) => <NewsRow key={n.id} n={n} last={i === related.length - 1} />)}</div>}
    </div>
  );
  return <CompanyV12 c={c} d={d} club={club ?? undefined} fic={fic ?? undefined} watchers={watchers} clubLine={clubLine} more={more} />;
}
