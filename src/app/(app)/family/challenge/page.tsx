import Link from "next/link";
import { redirect } from "next/navigation";
import { Tag } from "@/components/ui";
import { EmptyState, StatTile } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { MissionList } from "@/components/family/MissionList";
import { ActivityPing } from "@/components/family/ActivityPing";
import { getFamilyMissions, getHousehold } from "@/lib/live/family";

/** This week's family missions on FTA `fic_missions` + `mission_completions` (each member completes their own). */
export default async function FamilyChallengePage() {
  const family = await getHousehold();
  if (!family) redirect("/family");
  const missions = await getFamilyMissions();
  const done = missions?.filter((m) => m.doneByMe).length ?? 0;
  const anyone = missions?.filter((m) => m.completedBy.length > 0).length ?? 0;
  const xp = missions?.reduce((a, m) => a + (m.doneByMe ? m.xp : 0), 0) ?? 0;

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="Family missions" />
      <div className="px-[18px] pb-6">
        <ActivityPing active={family.isKid} />
        <div className="bg-card border border-line rounded-card px-4 py-4">
          <div className="flex items-center gap-2"><Tag tone="orange">FAMILY MISSIONS</Tag><span className="text-[11px] font-extrabold text-ink-3">{family.name}</span></div>
          <h1 className="mt-2 text-[19px] font-black text-ink leading-[1.25]">Small things to do together</h1>
          <p className="mt-2 text-[13px] font-bold text-ink-2 leading-[1.5]">Each mission is a conversation or a tiny task. Everyone who does it earns the XP — kids get their own version of the prompt.</p>
        </div>
        {missions ? (
          <>
            <div className="mt-3 flex gap-[9px]">
              <StatTile value={`${done}/${missions.length}`} label="you did" tone="green" />
              <StatTile value={anyone} label="family started" tone="orange" />
              <StatTile value={`+${xp}`} label="XP earned" />
            </div>
            <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Missions</h2>
            <MissionList missions={missions} members={family.members} isKid={family.isKid} />
          </>
        ) : <div className="mt-3"><EmptyState emoji="🎯" title="No missions yet" body="Missions are published by the FIC team. Check back soon." /></div>}
        <div className="mt-5 bg-purple-tint border border-purple-line rounded-card px-4 py-3 flex items-center gap-3">
          <span className="text-[22px]">🌙</span>
          <div className="flex-1"><div className="text-[13px] font-black text-ink">Family Investing Night</div><div className="text-[11.5px] font-bold text-purple-2">Pick a company together and talk it through.</div></div>
          <Link href="/family/night" className="text-[12px] font-extrabold text-purple-2">Start ›</Link>
        </div>
      </div>
    </div>
  );
}
