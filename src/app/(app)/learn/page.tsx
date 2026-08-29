import { getGames, getPortfolio } from "@/lib/data-live";
import { getCourse, getLearnHub } from "@/lib/live/learning";
import { LearnHubV13, type LearnTab } from "@/components/learn/LearnHubV13";

/** Learn = the LMS hub over the real curriculum: Path · Courses · Live · Practice · Review. */
export default async function LearnPage(props: PageProps<"/learn">) {
  const [sp, p, hub, games] = await Promise.all([props.searchParams, getPortfolio(), getLearnHub(), getGames()]);
  // The Path tab is the course the member is actually in the middle of.
  const course = hub?.continueLesson ? await getCourse(hub.continueLesson.courseSlug) : null;
  const t = String(sp.tab ?? "path");
  const tab: LearnTab = (["path", "courses", "live", "practice", "review"] as const).includes(t as LearnTab) ? (t as LearnTab) : "path";
  return <LearnHubV13 tab={tab} portfolio={{ value: p.totalValue, changePct: p.dayChangePct, holdings: p.holdings.length, series: p.series }} hub={hub} course={course} games={games} />;
}
