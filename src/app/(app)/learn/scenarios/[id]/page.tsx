import { notFound } from "next/navigation";
import { ScenarioPlayer } from "@/components/learn/ScenarioPlayer";
import { CrashScenario } from "@/components/learn/CrashScenario";
import { EarningsSurpriseIntro } from "@/components/learn/EarningsSurpriseIntro";
import { getScenario } from "@/lib/data-live";

/** Scenario lessons: `market-crash` is the immersive prototype-v2 scenario; others use the Simbot player. */
export default async function ScenarioPage(props: PageProps<"/learn/scenarios/[id]">) {
  const { id } = await props.params;
  if (id === "market-crash") return <CrashScenario />;
  if (id === "earnings-surprise") return <EarningsSurpriseIntro />;
  const s = await getScenario(id);
  if (!s) notFound();
  return <ScenarioPlayer scenario={s} />;
}
