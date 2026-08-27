import { notFound } from "next/navigation";
import { getIdea, getIdeaComments } from "@/lib/data-live";
import { SubHeader } from "@/components/club/SubHeader";
import { DiscussThread } from "@/components/club/DiscussThread";

export default async function DiscussPage(props: PageProps<"/club/idea/[id]/discuss">) {
  const { id } = await props.params;
  const idea = await getIdea(id);
  if (!idea) notFound();
  const comments = await getIdeaComments(id);
  return (
    <>
      <SubHeader backHref={`/club/idea/${id}`} title="Discussion" />
      <DiscussThread ideaId={id} title={idea.title} comments={comments} />
    </>
  );
}
