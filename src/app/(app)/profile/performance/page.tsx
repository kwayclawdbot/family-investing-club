import { getMyPortfolio, getPortfolio } from "@/lib/data-live";
import { MyPerformance } from "@/components/profile/MyPerformance";

export default async function MyPerformancePage(props: PageProps<"/profile/performance">) {
  const [sp, mine, practice] = await Promise.all([props.searchParams, getMyPortfolio(), getPortfolio()]);
  const tab = sp.tab === "practice" ? "practice" : sp.tab === "verified" ? "verified" : "picks";
  return <MyPerformance initialTab={tab} connected={!!mine.brokerage} allocation={mine.allocation} practiceValue={practice.totalValue} practicePct={practice.dayChangePct} holdings={practice.holdings.length} />;
}
