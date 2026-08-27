import Link from "next/link";
import { getGroups } from "@/lib/data-live";
import { GroupsList } from "@/components/club/Groups";
import { PlusIcon } from "@/components/ui/icons";

/** Artboard 26 — Groups: family / classroom / topic. */
export default async function GroupsPage() {
  const groups = await getGroups();
  return (
    <div className="pt-[18px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Groups</h1>
        <Link href="/club/create" aria-label="Create a club" className="w-[34px] h-[34px] rounded-full bg-purple text-white flex items-center justify-center"><PlusIcon size={18} /></Link>
      </div>
      <GroupsList groups={groups} />
    </div>
  );
}
