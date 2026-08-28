import { notFound } from "next/navigation";
import { getCompany, getMetrics, getNews, getClubConsensus, getFicConsensus, clubWatchers, getPicks, getClubPortfolio } from "@/lib/data-live";
import { resolveCompany } from "@/components/markets/companies-extra";
import { dossiers, genericDossier } from "@/lib/fixtures/v12-explore";
import { companyExtras, genericExtra, newsItems } from "@/lib/fixtures/v13-discover";
import { CompanyV13 } from "@/components/markets/v13/CompanyV13";

const COLORS: Record<string, string> = { kway: "#4C8C4A", andwele: "#7BA05B", arielle: "#E9B949", mom: "#D98E73", dad: "#B08968" };
const RINGS: Record<string, string> = { kway: "#8B7BC7", andwele: "#E9C46A", arielle: "#E6DFCF", mom: "#E6DFCF", dad: "#E9C46A" };

/** Company — prototype v2 `company`: understand one investment, see your club + FIC, make a pick. */
export default async function CompanyPage(props: PageProps<"/discover/[symbol]">) {
  const { symbol } = await props.params;
  const sym = symbol.toUpperCase();
  const c = resolveCompany(await getCompany(sym), sym);
  if (!c) notFound();
  const [metrics, news, club, fic, picks, portfolio] = await Promise.all([getMetrics(sym), getNews(), getClubConsensus(sym), getFicConsensus(sym), getPicks(), getClubPortfolio()]);
  const ids = clubWatchers(sym);
  const symPicks = picks.filter((p) => p.symbol === sym);
  const holding = portfolio.holdings.find((h) => h.symbol === sym);
  const avatars = (ids.length ? ids : symPicks.map((p) => p.authorId)).slice(0, 3).map((id) => ({ initial: id[0].toUpperCase(), color: COLORS[id] ?? "#8B7BC7", ring: RINGS[id] ?? "#E6DFCF" }));
  const line = [holding ? `Your club: ${holding.weightPct}% holding` : "Your club: no holding yet", ids.length ? `${ids.length} own it ✓` : null].filter(Boolean).join(" · ");
  const sub = symPicks.length ? symPicks.slice(0, 2).map((p) => `${p.author} ${p.stance.toUpperCase()}${p.stance === "buy" ? ` "${p.reason.split(".")[0].slice(0, 28)}"` : ""}`).join(" · ") : "No picks yet — make the first one";
  const d = dossiers[sym] ?? genericDossier(c.name);
  const extra = companyExtras[sym] ?? genericExtra(c.name);
  const cap = metrics.find((m) => m.key === "mcap")?.value;
  const related = news.filter((n) => n.symbols.includes(sym))[0];
  const fx = newsItems.find((n) => n.symbol === sym);
  const newsLine = extra?.newsLine ?? (fx ? fx.headline.replace(/^[A-Za-z]+ /, "") : related?.headline);
  const ficData = fic ? { buy: fic.buyPct, watch: fic.watchPct, pass: fic.passPct, picks: fic.picks, verified: fic.verifiedOwners } : null;
  void club;
  return (
    <CompanyV13
      symbol={sym} name={c.name} price={c.price} changePct={c.changePct} series={c.series ?? {}}
      extra={extra} dossier={d} marketCap={cap && cap !== "—" ? cap : undefined}
      club={{ line, sub, avatars, hasPick: symPicks.some((p) => p.authorId === "kway"), hasHolding: !!holding }}
      fic={ficData} newsLine={newsLine}
    />
  );
}
