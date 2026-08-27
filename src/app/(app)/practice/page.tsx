import { getPortfolio } from "@/lib/data-live";
import { PracticeHub } from "@/components/practice/PracticeHub";
/** Practice — "Can I actually do this?" (v12): Games · Charts · Scenarios · Portfolio + contextual entry from the last lesson. */
export default async function PracticePage() {
  const p = await getPortfolio();
  return <PracticeHub portfolio={{ value: p.totalValue, changePct: p.dayChangePct, holdings: p.holdings.length, series: p.series }} />;
}
