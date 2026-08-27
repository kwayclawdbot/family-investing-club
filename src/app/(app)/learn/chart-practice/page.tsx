import { ChartPractice } from "@/components/learn/ChartPractice";
import { getChartDrills } from "@/lib/data";

/** Artboard 18 — Chart Practice / Chart Sprint. */
export default async function ChartPracticePage() {
  const drills = await getChartDrills();
  return <ChartPractice drills={drills} />;
}
