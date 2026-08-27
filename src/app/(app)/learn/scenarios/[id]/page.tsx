import { notFound } from "next/navigation";
import { ScenarioPlayer } from "@/components/learn/ScenarioPlayer";
import { getScenario } from "@/lib/data";

/** Artboard 19 — Scenario lesson + Simbot coach. */
export default async function ScenarioPage(props: PageProps<"/learn/scenarios/[id]">) {
  const { id } = await props.params;
  const s = await getScenario(id);
  if (!s) notFound();
  return <ScenarioPlayer scenario={s} />;
}
