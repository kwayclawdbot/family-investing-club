import { getClub, clubVisibleMembers, getPicks, getProposals, getResearch, getClubActivity, getClubPortfolio } from "@/lib/data";
import { MyClub } from "@/components/club/MyClub";

export default async function ClubResearchPage() {
  const [club, picks, proposals, research, activity, portfolio] = await Promise.all([getClub(), getPicks(), getProposals(), getResearch(), getClubActivity(), getClubPortfolio()]);
  return <MyClub club={club} visible={clubVisibleMembers} picks={picks} proposals={proposals} research={research} activity={activity} portfolio={portfolio} initialTab="Research" />;
}
