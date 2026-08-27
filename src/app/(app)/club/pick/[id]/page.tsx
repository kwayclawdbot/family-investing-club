import { getClub, getPick } from "@/lib/data-live";
import { PickThread } from "@/components/club/PickThread";

export default async function PickPage(props: PageProps<"/club/pick/[id]">) {
  const { id } = await props.params;
  const [club, pick] = await Promise.all([getClub(), getPick(id)]);
  // Locally-made picks (fic.picks) hydrate on the client; unknown ids show a soft empty state.
  return <PickThread pick={pick} club={club} id={id} />;
}
