import Link from "next/link";
import { learnPath } from "@/lib/fixtures/v12-explore";
import { Eyebrow } from "@/components/markets/v12/bits";

/** Learn — "What should I learn next?" (v12): one path, one Next card, the path, three secondary entries. */
export function LearnV12({ streak, next }: { streak: number; next?: { title: string; sub: string; href: string; no: number } }) {
  const p = learnPath; const n = next ?? p.next;
  const icon = (s: string) => s === "mastered" || s === "done" ? <span className="w-[22px] h-[22px] rounded-full bg-green-2 text-white text-[13px] font-black flex items-center justify-center">✓</span> : s === "next" ? <span className="w-[22px] h-[22px] rounded-full bg-green text-white text-[11px] flex items-center justify-center">▶</span> : s === "checkpoint" ? <span className="w-[22px] h-[22px] rounded-full bg-gold text-[13px] flex items-center justify-center">⭐</span> : <span className="w-[22px] h-[22px] rounded-full bg-line-3 text-white text-[11px] flex items-center justify-center">🔒</span>;
  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between"><h1 className="text-[21px] font-black text-ink">Learn</h1><span className="rounded-[18px] bg-orange-tint px-3 py-[5px] text-[12px] font-black text-orange-2">🔥 {streak} days</span></div>
      <div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-3">
        <Eyebrow>YOUR PATH</Eyebrow>
        <div className="flex justify-between items-baseline mt-1"><span className="text-[16px] font-black text-ink">{p.title}</span><span className="text-[11px] font-black text-green">{p.done} of {p.total}</span></div>
        <div className="flex gap-1 mt-2">{Array.from({ length: p.total }).map((_, i) => <span key={i} className={`flex-1 h-[6px] rounded-[4px] ${i < p.done ? "bg-green-2" : "bg-line-2"}`} />)}</div>
      </div>
      <Link href={n.href} className="mt-3 block rounded-[16px] border border-green-line px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(105deg,#EAF2E3,#F1F7EB)" }}>
        <span className="w-10 h-10 rounded-[12px] bg-green-2 text-white flex items-center justify-center text-[16px]">▶</span>
        <div className="flex-1"><div className="text-[10px] font-black text-green">NEXT · LESSON {n.no}</div><div className="text-[15.5px] font-black text-ink">{n.title}</div><div className="text-[10.5px] font-bold text-ink-3">{n.sub}</div></div>
      </Link>
      <Eyebrow className="mt-4 mb-2">THE PATH</Eyebrow>
      <div className="relative pl-1"><span className="absolute left-[14px] top-3 bottom-3 w-[2px] bg-line rounded" />
        {p.nodes.map((node) => <div key={node.title} className="relative flex items-center gap-3 py-[7px]">{icon(node.state)}<span className={`flex-1 text-[12.5px] font-bold ${node.state === "next" ? "text-ink font-black text-[13px]" : node.state === "locked" || node.state === "checkpoint" ? "text-ink-2" : "text-ink-3"}`}>{node.title}</span><span className={`text-[10px] font-black ${node.state === "next" ? "text-orange-2" : "text-green"}`}>{node.state === "mastered" ? "✓ mastered" : node.state === "done" ? "✓" : node.state === "next" ? "up next" : ""}</span></div>)}
      </div>
      <div className="flex gap-2 mt-4">{[["📚 Courses", "/learn/library"], ["🎥 Live", "/live"], ["🃏 Review", "/learn/review"]].map(([l, h]) => <Link key={h} href={h} className="flex-1 bg-card border border-line rounded-[12px] py-[9px] text-center text-[11px] font-bold text-ink-2">{l}</Link>)}</div>
    </div>
  );
}
