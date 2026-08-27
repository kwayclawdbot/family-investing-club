import { HomeSwitch } from "@/components/home/HomeSwitch";
import { HomeV4 } from "@/components/home/HomeV4";
import { ChildHome } from "@/components/home/ChildHome";
import { getChildHome, getClub, getProposal, identityOf, beltFor } from "@/lib/data-live";

/** Home v4 — conversation-first (canvas v11, board 12). Child accounts keep the protected composition. */
export default async function HomePage(props: PageProps<"/home">) {
  const sp = await props.searchParams;
  const forceChild = sp.as === "child";
  const initialFeed = sp.feed === "private" ? "private" : "main";
  const [child, club, proposal] = await Promise.all([getChildHome(), getClub(), getProposal("add-ceg-4")]);
  const belt = beltFor(identityOf("kway")?.lifetimeXp ?? 2640).color;
  const open = proposal && proposal.status === "open"
    ? { id: proposal.id, text: `${proposal.symbol} vote closes in ${proposal.endsIn.replace(/^in /, "")}`, voted: proposal.votes.filter((v) => v.vote).length, eligible: proposal.votes.length - 1, hoursLeft: 8 }
    : null;
  return (
    <HomeSwitch forceChild={forceChild} adult={<HomeV4 belt={belt} clubName={club.shortName} initialFeed={initialFeed} openProposal={open} />} child={<ChildHome data={child} />} />
  );
}
