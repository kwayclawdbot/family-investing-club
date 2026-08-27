import { TopBar } from "@/components/shell/TopBar";
import { ChartPractice } from "@/components/learn/ChartPractice";
import { getChartDrills } from "@/lib/data";

export default async function ChartPracticePage() {
  const drills = await getChartDrills();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/learn" title="Chart Practice" />
      <div className="px-[18px]"><ChartPractice drills={drills} /></div>
    </div>
  );
}
