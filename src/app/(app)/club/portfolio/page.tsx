import { getClubPortfolio, getProposals } from "@/lib/data";
import { ClubPortfolioView } from "@/components/club/ClubPortfolioView";

export default async function ClubPortfolioPage() {
  const [portfolio, proposals] = await Promise.all([getClubPortfolio(), getProposals()]);
  return <ClubPortfolioView portfolio={portfolio} proposals={proposals} />;
}
