import { ChartRush } from "@/components/learn/ChartRush";
import { getChartDrills } from "@/lib/data-live";
/** Chart Rush (prototype v2 `chartdrill`). */
export default async function ChartPracticePage() { return <ChartRush drills={await getChartDrills()} />; }
