import { getClub, getProposal } from "@/lib/data-live";
import { VoteScreen } from "@/components/club/VoteScreen";

export default async function VotePage(props: PageProps<"/club/vote/[id]">) {
  const { id } = await props.params;
  const [club, proposal] = await Promise.all([getClub(), getProposal(id)]);
  return <VoteScreen proposal={proposal} club={club} id={id} />;
}
