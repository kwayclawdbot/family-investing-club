import { notFound } from "next/navigation";
import { getChallenge, getGroup } from "@/lib/data-live";
import { SubHeader } from "@/components/club/SubHeader";
import { ChallengeDetail } from "@/components/club/Challenges";

const GROUP_FOR: Record<string, string> = {
  "family-brand-research": "mensah-family",
  "diversify-under-constraints": "beginners-circle",
  "explain-it-to-a-kid": "beginners-circle",
  "class-market-week": "ms-rivera-period-3",
};

export default async function ChallengePage(props: PageProps<"/club/challenges/[id]">) {
  const { id } = await props.params;
  const c = await getChallenge(id);
  if (!c) notFound();
  const group = GROUP_FOR[id] ? await getGroup(GROUP_FOR[id]) : undefined;
  return (
    <>
      <SubHeader backHref="/club/challenges" title="Challenge" />
      <ChallengeDetail c={c} group={group} />
    </>
  );
}
