import { getFamily, subscription } from "@/lib/data-live";
import { TopBar } from "@/components/shell/TopBar";
import { InviteManager } from "@/components/family/InviteManager";

export default async function FamilyInvitePage() {
  const family = await getFamily();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="Add family members" />
      <div className="px-[18px]"><InviteManager code={family.inviteCode} seats={subscription.seats} /></div>
    </div>
  );
}
