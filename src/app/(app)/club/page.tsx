import { getClub, getClubOverview, getPortfolioTab, getMemberCards, getVerifiedExposure } from "@/lib/data-live";
import { ClubWorkspace, type WorkspaceTab } from "@/components/club/workspace/ClubWorkspace";
import { getClubChat } from "@/lib/live/club";
import { getCircles } from "@/lib/live/community";

/** Old deep links keep working: overview→chat, portfolio→performance. */
const asTab = (v: string | string[] | undefined): WorkspaceTab =>
  v === "performance" || v === "portfolio" ? "performance" : v === "decisions" ? "decisions" : v === "members" ? "members" : "chat";

export default async function ClubPage(props: PageProps<"/club">) {
  // Signed in → the family thread (family_circle_messages); signed out (demo) → null, and the pane keeps its fixtures.
  const [sp, club, overview, portfolio, members, exposure, chat, circles] = await Promise.all([props.searchParams, getClub(), getClubOverview(), getPortfolioTab(), getMemberCards(), getVerifiedExposure(), getClubChat(), getCircles()]);
  return <ClubWorkspace club={club} overview={overview} portfolio={portfolio} members={members} exposure={exposure} initialTab={asTab(sp.tab)} forceNew={sp.state === "new"} chat={chat} circles={circles} />;
}
