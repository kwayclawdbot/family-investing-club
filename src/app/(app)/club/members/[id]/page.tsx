import { notFound } from "next/navigation";
import { getMember, getIdea } from "@/lib/data";
import { SubHeader } from "@/components/club/SubHeader";
import { MemberProfile } from "@/components/club/MemberProfile";

export default async function MemberPage(props: PageProps<"/club/members/[id]">) {
  const { id } = await props.params;
  const m = await getMember(id);
  if (!m) notFound();
  const nuclear = id === "sarah-j" ? await getIdea("nuclear-next-decade") : undefined;
  return (
    <>
      <SubHeader backHref="/club" title="Member" />
      <MemberProfile m={m} ideas={nuclear ? [nuclear] : []} />
    </>
  );
}
