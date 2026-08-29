import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { InviteManager } from "@/components/family/InviteManager";
import { getFamilyInvites, getHousehold } from "@/lib/live/family";

/** Add family members (parents): real invites on FTA `family_invites`; the invitee lands on /join/CODE. */
export default async function FamilyInvitePage() {
  const family = await getHousehold();
  if (!family || !family.isParent) redirect("/family");
  const invites = (await getFamilyInvites()) ?? [];
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family/members" title="Add family members" />
      <div className="px-[18px]">
        <div className="text-[12.5px] font-bold text-ink-3">{family.members.length} in {family.name}. Invites are good for 7 days and work once.</div>
        <InviteManager invites={invites} familyName={family.name} />
      </div>
    </div>
  );
}
