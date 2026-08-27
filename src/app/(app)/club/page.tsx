import { getClub, getClubOverview, getPortfolioTab, getMemberCards, getVerifiedExposure } from "@/lib/data-live";
import { ClubWorkspace, type WorkspaceTab } from "@/components/club/workspace/ClubWorkspace";

const asTab = (v: string | string[] | undefined): WorkspaceTab => (v === "portfolio" || v === "members" ? v : "overview");

export default async function ClubPage(props: PageProps<"/club">) {
  const [sp, club, overview, portfolio, members, exposure] = await Promise.all([props.searchParams, getClub(), getClubOverview(), getPortfolioTab(), getMemberCards(), getVerifiedExposure()]);
  return (
    <ClubWorkspace
      club={club} overview={overview} portfolio={portfolio} members={members} exposure={exposure}
      initialTab={asTab(sp.tab)} portfolioView={sp.view === "verified" ? "verified" : "model"} forceNew={sp.state === "new"}
    />
  );
}
