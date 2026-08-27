import { getLearners, getWatchlist } from "@/lib/data-live";
import { TopBar } from "@/components/shell/TopBar";
import { ResearchList } from "@/components/family/ResearchList";

export default async function FamilyResearchPage() {
  const [watch, learners] = await Promise.all([getWatchlist(), getLearners()]);
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="Family research list" />
      <div className="px-[18px]"><ResearchList items={watch.filter((w) => w.list === "family")} learners={learners} /></div>
    </div>
  );
}
