import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Card, Tag } from "@/components/ui";
import { ClockIcon } from "@/components/ui/icons";
import { getScenarios } from "@/lib/data-live";

export default async function ScenariosPage() {
  const list = await getScenarios();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/learn" title="Scenarios" />
      <div className="px-[18px] pb-6">
        <h1 className="text-[21px] font-black text-ink mt-1">Decide, then see what happens</h1>
        <p className="text-[13px] font-bold text-ink-3 mt-1">Guided market situations. No money at stake — just judgement.</p>
        <div className="flex flex-col gap-3 mt-4">
          {list.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center gap-2"><Tag tone="orange">Scenario</Tag><span className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-ink-3"><ClockIcon /> {s.minutes} min</span></div>
              <div className="text-[16px] font-black text-ink mt-2">{s.title}</div>
              <p className="text-[13px] font-bold text-ink-3 mt-1 leading-[1.45]">{s.blurb}</p>
              <Link href={`/learn/scenarios/${s.id}`} className="inline-flex mt-3 h-[36px] px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">Start</Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
