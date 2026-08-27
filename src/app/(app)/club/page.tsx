import { getClub, getClubOverview, getPortfolioTab, getMemberCards, getVerifiedExposure } from "@/lib/data-live";
import { ClubWorkspace, type WorkspaceTab } from "@/components/club/workspace/ClubWorkspace";

/** Old deep links keep working: overview→chat, portfolio→performance. */
const asTab = (v: string | string[] | undefined): WorkspaceTab =>
  v === "performance" || v === "portfolio" ? "performance" : v === "decisions" ? "decisions" : v === "members" ? "members" : "chat";

export default async function ClubPage(props: PageProps<"/club">) {
  const [sp, club, overview, portfolio, members, exposure] = await Promise.all([props.searchParams, getClub(), getClubOverview(), getPortfolioTab(), getMemberCards(), getVerifiedExposure()]);
  return <ClubWorkspace club={club} overview={overview} portfolio={portfolio} members={members} exposure={exposure} initialTab={asTab(sp.tab)} forceNew={sp.state === "new"} />;
}
