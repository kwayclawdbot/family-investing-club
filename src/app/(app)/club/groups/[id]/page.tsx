import { notFound } from "next/navigation";
import { getGroup, getMembers, getChallenges, getIdea } from "@/lib/data";
import { SubHeader } from "@/components/club/SubHeader";
import { GroupDetail } from "@/components/club/Groups";

export default async function GroupPage(props: PageProps<"/club/groups/[id]">) {
  const { id } = await props.params;
  const g = await getGroup(id);
  if (!g) notFound();
  const [members, challenges, nuclear] = await Promise.all([getMembers(), getChallenges(), getIdea("nuclear-next-decade")]);
  const ideas = g.id === "ai-infrastructure" && nuclear ? [nuclear] : [];
  const shown = g.kind === "family" ? members.filter((m) => m.id === "arielle-m") : members;
  return (
    <>
      <SubHeader backHref="/club/groups" title="Group" />
      <GroupDetail g={g} members={shown} challenges={challenges} ideas={ideas} />
    </>
  );
}
