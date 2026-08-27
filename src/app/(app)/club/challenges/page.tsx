import { getChallenges } from "@/lib/data";
import { SubHeader } from "@/components/club/SubHeader";
import { ChallengesList } from "@/components/club/Challenges";

export default async function ChallengesPage() {
  const challenges = await getChallenges();
  return (
    <>
      <SubHeader backHref="/club" title="Challenges" />
      <ChallengesList challenges={challenges} />
    </>
  );
}
