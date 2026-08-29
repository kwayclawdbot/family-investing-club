import { getMyPortfolio, getPortfolio } from "@/lib/data-live";
import { getMyPicksPerformance } from "@/lib/live/me-performance";
import { MyPerformanceV13 } from "@/components/profile/MyPerformanceV13";

export default async function MyPerformancePage(props: PageProps<"/profile/performance">) {
  const [sp, mine, practice, picks] = await Promise.all([props.searchParams, getMyPortfolio(), getPortfolio(), getMyPicksPerformance()]);
  const tab = sp.tab === "practice" ? "practice" : sp.tab === "verified" ? "verified" : "picks";
  return <MyPerformanceV13 tab={tab} connected={!!mine.brokerage} allocation={mine.allocation} practice={{ value: practice.totalValue, pct: practice.dayChangePct, holdings: practice.holdings.length }} m={picks} />;
}
