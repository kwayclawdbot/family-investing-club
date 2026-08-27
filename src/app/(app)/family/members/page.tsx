import Link from "next/link";
import { getLearners } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { ParentControls } from "@/components/family/ParentControls";
import { LearnerAction } from "@/components/family/LearnerAction";

/** Parent view (artboard 28): progress per learner + guardian controls. Display facts come from the artboard. */
const VIEW: Record<string, { age?: number; lv: number; tail?: string; action?: { text: string; kind: "assign" | "cheer"; task?: string } }> = {
  andwele: { age: 15, lv: 6, action: { text: "Struggling with: DIVERSIFICATION", kind: "assign", task: "Review: Diversification" } },
  arielle: { age: 11, lv: 3, action: { text: "Great streak — send a cheer", kind: "cheer" } },
  mom: { lv: 5, tail: "joined family portfolio" },
};
const LEVEL: Record<string, string> = { andwele: "Builder", arielle: "Explorer", mom: "Investor" };

export default async function FamilyMembersPage() {
  const learners = (await getLearners()).filter((l) => l.id !== "kway");
  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <Link href="/family" aria-label="Back" className="text-ink-3 -ml-1"><ChevronLeft size={20} /></Link>
        <span className="text-[15px] font-black text-ink">Manage Family</span>
        <Link href="/family/invite" className="border-[1.5px] border-green-2 text-green rounded-[10px] px-3 py-[6px] text-[11px] font-black">+ Invite</Link>
      </div>
      <p className="mt-[10px] text-[12px] font-extrabold text-ink-3">You see progress — you never log in as them.</p>

      <div className="mt-[10px] flex flex-col gap-[10px]">
        {learners.map((l) => {
          const v = VIEW[l.id] ?? { lv: 4 };
          const meta = [`${LEVEL[l.id] ?? l.level} level`, `Lv ${v.lv}`, v.tail ?? `🔥 ${l.streak} days`, v.tail ? null : l.pathTitle].filter(Boolean).join(" · ");
          return (
            <div key={l.id} className="bg-card border border-line rounded-[16px] px-4 py-[13px]">
              <Link href={`/family/members/${l.id}`} className="flex items-center gap-3">
                <Avatar name={l.name} color={l.color} size={40} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-black text-ink">{l.name}{v.age ? ` · ${v.age}` : ""}</span>
                  <span className="block text-[11px] font-bold text-ink-3">{meta}</span>
                </span>
                <ChevronRight className="text-ink-4" />
              </Link>
              {v.action && <LearnerAction learnerId={l.id} text={v.action.text} action={v.action.kind} taskTitle={v.action.task} />}
            </div>
          );
        })}
      </div>

      <Link href="/family/invite" className="mt-3 flex items-center justify-center h-[46px] rounded-[14px] border-2 border-dashed border-green-line text-green text-[13px] font-black bg-green-tint-2">
        ＋ Add a family member or child profile
      </Link>

      <h2 className="mt-5 mb-2 text-[14px] font-black text-ink">Guardian controls</h2>
      <ParentControls />
      <p className="mt-2 text-[11px] font-bold text-ink-4">Children keep a protected account: stocks &amp; ETFs-only practice, public community off, family club participation per these settings.</p>
    </div>
  );
}
