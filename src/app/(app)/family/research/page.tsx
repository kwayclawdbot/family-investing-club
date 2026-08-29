import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { EmptyState } from "@/components/ui/extras";
import { WatchlistManager } from "@/components/family/WatchlistManager";
import { ActivityPing } from "@/components/family/ActivityPing";
import { getFamilyWatchlist, getHousehold } from "@/lib/live/family";

/** Family research list on FTA `family_watchlist` + tonight's vote. Everyone in the household reads, adds and votes. */
export default async function FamilyResearchPage() {
  const family = await getHousehold();
  if (!family) redirect("/family");
  const list = await getFamilyWatchlist();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="Family research list" />
      <div className="px-[18px]">
        <ActivityPing active={family.isKid} />
        {list ? <WatchlistManager list={list} me={family.me} isParent={family.isParent} /> : <EmptyState emoji="🔎" title="Couldn't load the list" body="Try again in a moment." />}
      </div>
    </div>
  );
}
