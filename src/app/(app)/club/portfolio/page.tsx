import { getClubPortfolio, getProposals, getVerifiedExposure } from "@/lib/data";
import { ClubPortfolioView } from "@/components/club/ClubPortfolioView";

const flag = (v: string | string[] | undefined) => (v === "1" ? true : v === "0" ? false : undefined);

export default async function ClubPortfolioPage(props: PageProps<"/club/portfolio">) {
  const [sp, portfolio, proposals, exposure] = await Promise.all([props.searchParams, getClubPortfolio(), getProposals(), getVerifiedExposure()]);
  return <ClubPortfolioView portfolio={portfolio} proposals={proposals} exposure={exposure} view={sp.view === "verified" ? "verified" : "model"} connected={flag(sp.connected)} />;
}
