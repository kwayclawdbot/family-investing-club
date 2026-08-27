import { getGroups } from "@/lib/data";
import { SubHeader } from "@/components/club/SubHeader";
import { GroupsList } from "@/components/club/Groups";

export default async function GroupsPage() {
  const groups = await getGroups();
  return (
    <>
      <SubHeader backHref="/club" title="Groups" />
      <GroupsList groups={groups} />
    </>
  );
}
