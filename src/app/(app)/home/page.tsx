import { HomeSwitch } from "@/components/home/HomeSwitch";
import { HomeV4 } from "@/components/home/HomeV4";
import { ChildHome } from "@/components/home/ChildHome";
import { getChildHome, getClub, getProposals, identityOf, beltFor } from "@/lib/data-live";
import { getFeed } from "@/lib/live/community";

/** Prototype v3 `home` / `homeprivate`: conversation-first — circles rail · Main | Private feed · composer · rich artifacts.
 *  Performance lives in My Performance and Club → Performance. Child accounts keep the protected composition. */
export default async function HomePage(props: PageProps<"/home">) {
  const sp = await props.searchParams;
  const forceChild = sp.as === "child";
  // Signed in → the real feed_posts rows; signed out (demo) → null, and HomeV4 keeps the fixtures.
  const [child, club, proposals, livePosts] = await Promise.all([getChildHome(), getClub(), getProposals(), getFeed(30)]);
  const belt = beltFor(identityOf("kway")?.lifetimeXp ?? 0);
  const open = proposals.find((p) => p.status === "open");
  const openProposal = open
    ? { id: open.id, text: `Vote open: $${open.symbol} ${open.fromWeightPct}% → ${open.toWeightPct}%`, voted: open.votes.filter((v) => v.vote).length, eligible: open.votes.length, hoursLeft: parseInt(open.endsIn) * (open.endsIn.includes("day") ? 24 : 1) || 8 }
    : null;
  return (
    <HomeSwitch forceChild={forceChild}
      adult={<HomeV4 belt={belt.color} clubName={club.shortName} initialFeed={sp.feed === "private" ? "private" : "main"} openProposal={openProposal} livePosts={livePosts} />}
      child={<ChildHome data={child} />} />
  );
}
