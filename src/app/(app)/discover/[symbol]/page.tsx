import { notFound } from "next/navigation";
import { getCompany, getMetrics, getClubConsensus, getFicConsensus, getPicks, getClubPortfolio } from "@/lib/data-live";
import { resolveCompany } from "@/components/markets/companies-extra";
import { getCircles } from "@/lib/live/community";
import { getNewsFeed } from "@/lib/live/newsfeed";
import { CompanyV13 } from "@/components/markets/v13/CompanyV13";
import { sectorOf } from "@/lib/server/shared/screener-sectors";
import { getSession } from "@/lib/live/session";

const COLORS = ["#4C8C4A", "#7BA05B", "#E9B949", "#D98E73", "#B08968", "#8B7BC7"];
const hue = (id: string) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };

/** Company — understand one investment, see your club's case on it, make a pick. */
export default async function CompanyPage(props: PageProps<"/discover/[symbol]">) {
  const { symbol } = await props.params;
  const sym = symbol.toUpperCase();
  const c = resolveCompany(await getCompany(sym), sym);
  if (!c) notFound();
  const [metrics, fic, picks, portfolio, circles, news, session] = await Promise.all([
    getMetrics(sym), getFicConsensus(sym), getPicks(), getClubPortfolio(), getCircles(), getNewsFeed(), getSession(),
  ]);
  void getClubConsensus; // club opinion is rendered from the club's own picks below

  const symPicks = picks.filter((p) => p.symbol === sym);
  const holding = portfolio.holdings.find((h) => h.symbol === sym);
  const avatars = symPicks.slice(0, 3).map((p) => ({ initial: p.author.charAt(0).toUpperCase(), color: hue(p.authorId), ring: hue(p.author) }));
  const line = [holding ? `Your club holds ${Math.round(holding.weightPct)}%` : "Your club holds none of this",
    symPicks.length ? `${symPicks.length} ${symPicks.length === 1 ? "pick" : "picks"}` : null].filter(Boolean).join(" · ");
  const sub = symPicks.length
    ? symPicks.slice(0, 2).map((p) => `${p.author} ${p.stance.toUpperCase()}`).join(" · ")
    : "No picks yet — make the first one";

  const caseFor = (want: "bull" | "bear") => symPicks
    .filter((p) => (want === "bull" ? p.stance !== "pass" : p.stance === "pass"))
    .map((p) => ({ by: p.author, text: p.reason.split(".")[0].slice(0, 90) }));

  const circle = circles?.find((x) => x.symbol?.toUpperCase() === sym && x.open) ?? null;
  const newsLine = [...(news?.club ?? []), ...(news?.mine ?? []), ...(news?.markets ?? [])].find((n) => n.symbols.includes(sym))?.headline;

  return (
    <CompanyV13
      symbol={sym} name={c.name} price={c.price} changePct={c.changePct} series={c.series ?? {}}
      sector={sectorOf(c.sector) ?? c.sector ?? null} about={c.about ?? null}
      understand={(c.understand ?? []).map((u) => u.q)} metrics={metrics}
      bull={caseFor("bull")} bear={caseFor("bear")}
      circle={circle ? { slug: circle.slug, name: circle.name, daysLeft: circle.daysLeft } : null}
      club={{ line, sub, avatars, hasPick: symPicks.some((p) => p.authorId === session?.user.id), hasHolding: !!holding }}
      fic={fic ? { buy: fic.buyPct, watch: fic.watchPct, pass: fic.passPct, picks: fic.picks, verified: fic.verifiedOwners } : null}
      newsLine={newsLine}
    />
  );
}
