import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { ScenarioPlayer } from "@/components/learn/ScenarioPlayer";
import { getScenario } from "@/lib/data";

export default async function ScenarioPage(props: PageProps<"/learn/scenarios/[id]">) {
  const { id } = await props.params;
  const s = await getScenario(id);
  if (!s) notFound();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/learn/scenarios" title="Scenario" />
      <div className="px-[18px]"><ScenarioPlayer scenario={s} /></div>
    </div>
  );
}
