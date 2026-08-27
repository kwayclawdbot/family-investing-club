import { getClub, getResearch } from "@/lib/data-live";
import { ResearchPage } from "@/components/club/workspace/ResearchPage";

export default async function ClubResearchPage() {
  const [club, research] = await Promise.all([getClub(), getResearch()]);
  return <ResearchPage club={club} research={research} />;
}
