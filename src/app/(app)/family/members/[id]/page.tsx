import { notFound } from "next/navigation";
import { getLearner } from "@/lib/data-live";
import { TopBar } from "@/components/shell/TopBar";
import { LearnerDetail } from "@/components/family/LearnerDetail";

export default async function LearnerPage(props: PageProps<"/family/members/[id]">) {
  const { id } = await props.params;
  const learner = await getLearner(id);
  if (!learner) notFound();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family/members" title="Learner" />
      <div className="px-[18px]"><LearnerDetail learner={learner} /></div>
    </div>
  );
}
