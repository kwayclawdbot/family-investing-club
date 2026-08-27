import { getUser, getPortfolio } from "@/lib/data-live";
import { LearnHubV13, type LearnTab } from "@/components/learn/LearnHubV13";

/** Learn = the LMS hub (prototype v2): Path · Courses · Live · Practice · Review. */
export default async function LearnPage(props: PageProps<"/learn">) {
  const [sp, u, p] = await Promise.all([props.searchParams, getUser(), getPortfolio()]);
  const t = String(sp.tab ?? "path");
  const tab: LearnTab = (["path", "courses", "live", "practice", "review"] as const).includes(t as LearnTab) ? (t as LearnTab) : "path";
  return <LearnHubV13 tab={tab} streak={u.streakDays} portfolio={{ value: p.totalValue, changePct: p.dayChangePct, holdings: p.holdings.length, series: p.series }} />;
}
