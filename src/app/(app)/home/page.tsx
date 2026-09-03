import { HomeSwitch } from "@/components/home/HomeSwitch";
import { HomeV4 } from "@/components/home/HomeV4";
import { ChildHome } from "@/components/home/ChildHome";
import { getChildHome, getClub, getProposals, getUser, beltAtLevel } from "@/lib/data-live";
import { getCircles, getFeed } from "@/lib/live/community";
import { getClubChat } from "@/lib/live/club";

/** Prototype v3 `home` / `homeprivate`: conversation-first — circles rail · Main | Private feed · composer · rich artifacts.
 *  Performance lives in My Performance and Club → Performance. Child accounts keep the protected composition. */
export default async function HomePage(props: PageProps<"/home">) {
  const sp = await props.searchParams;
  const forceChild = sp.as === "child";
  // Signed in → the real feed_posts rows; signed out (demo) → null, and HomeV4 keeps the fixtures.
  const [child, club, proposals, livePosts, user, circles, chat] = await Promise.all([getChildHome(), getClub(), getProposals(), getFeed(30), getUser(), getCircles(), getClubChat(20)]);
  const belt = beltAtLevel(user.awardedLevel);
  const open = proposals.find((p) => p.status === "open");
  const openProposal = open
    ? { id: open.id, text: `Vote open: $${open.symbol} ${open.fromWeightPct}% → ${open.toWeightPct}%`, voted: open.votes.filter((v) => v.vote).length, eligible: open.votes.length, hoursLeft: parseInt(open.endsIn) * (open.endsIn.includes("day") ? 24 : 1) || 8 }
    : null;
  return (
    <HomeSwitch forceChild={forceChild}
      adult={<HomeV4 belt={belt.color} you={user.firstName} clubName={club.shortName} initialFeed={sp.feed === "private" ? "private" : "main"} openProposal={openProposal} livePosts={livePosts} circles={circles} chat={chat} members={club.members} />}
      child={<ChildHome data={child} />} />
  );
}
