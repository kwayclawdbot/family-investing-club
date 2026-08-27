import Link from "next/link";
import { KaiSpark } from "@/components/ui/icons";

/** Contextual learning bridge (Product Shift §14.1): "Haven't mastered X yet — N-min lesson before you vote?" */
export function LearnBridge({ concept, minutes, href, verb = "vote" }: { concept: string; minutes: number; href: string; verb?: string }) {
  return (
    <div className="mt-[10px] flex items-center gap-[10px] rounded-[14px] border border-green-line bg-green-tint px-[14px] py-[11px]">
      <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white flex items-center justify-center shrink-0"><KaiSpark size={12} /></span>
      <span className="flex-1 text-[11.5px] font-bold text-green leading-[1.4]">
        Haven’t mastered <b>{concept}</b> yet — {minutes}-min lesson before you {verb}?
      </span>
      <Link href={href} className="rounded-[9px] bg-green-2 px-[11px] py-[5px] text-[10.5px] font-black text-cream-text shrink-0">Learn</Link>
    </div>
  );
}
