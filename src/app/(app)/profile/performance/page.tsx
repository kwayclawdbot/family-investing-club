import { getMyPortfolio, getPortfolio } from "@/lib/data-live";
import { MyPerformanceV13 } from "@/components/profile/MyPerformanceV13";

export default async function MyPerformancePage(props: PageProps<"/profile/performance">) {
  const [sp, mine, practice] = await Promise.all([props.searchParams, getMyPortfolio(), getPortfolio()]);
  const tab = sp.tab === "practice" ? "practice" : sp.tab === "verified" ? "verified" : "picks";
  return <MyPerformanceV13 tab={tab} connected={!!mine.brokerage} allocation={mine.allocation} practice={{ value: practice.totalValue, pct: practice.dayChangePct, holdings: practice.holdings.length }} />;
}
