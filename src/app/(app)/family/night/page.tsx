import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { EmptyState } from "@/components/ui/extras";
import { FamilyNightFlow } from "@/components/family/FamilyNightFlow";
import { ActivityPing } from "@/components/family/ActivityPing";
import { getFamilyNight, getHousehold } from "@/lib/live/family";

/** Family Investing Night: vote (family_watchlist_votes) → talk → attendance (xp_events + family_night_sessions). */
export default async function FamilyNightPage() {
  const family = await getHousehold();
  if (!family) redirect("/family");
  const night = await getFamilyNight();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="Family Investing Night" />
      <div className="px-[18px]">
        <ActivityPing active={family.isKid} />
        {night ? (
          <>
            <div className="mb-3 bg-purple-tint border border-purple-line rounded-card px-4 py-3 flex items-center gap-3">
              <span className="text-[24px]">🌙</span>
              <div className="flex-1"><div className="text-[13.5px] font-black text-ink">{night.label}</div><div className="text-[11.5px] font-bold text-purple-2">One pick · four questions · +{night.xpPerAttendee} XP for everyone who shows up</div></div>
            </div>
            <FamilyNightFlow night={night} />
          </>
        ) : <EmptyState emoji="🌙" title="Couldn't load tonight" body="Try again in a moment." />}
      </div>
    </div>
  );
}
