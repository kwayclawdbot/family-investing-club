import Link from "next/link";
import { getFamily, getLearners } from "@/lib/data";
import { Avatar, ProgressBar, Tag, cx } from "@/components/ui";
import { ChevronRight } from "@/components/ui/icons";
import { TopBar } from "@/components/shell/TopBar";
import { ParentControls } from "@/components/family/ParentControls";

const ROLE: Record<string, { label: string; tone: "green" | "orange" | "purple" }> = {
  parent: { label: "Parent", tone: "green" },
  teen: { label: "Teen", tone: "purple" },
  child: { label: "Child", tone: "orange" },
};

export default async function FamilyMembersPage() {
  const [family, learners] = await Promise.all([getFamily(), getLearners()]);
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="Family members" />
      <div className="px-[18px] pb-6">
        <p className="text-[12.5px] font-bold text-ink-3">{family.name} · {learners.length} learners · you manage this household</p>

        <div className="mt-3 flex flex-col gap-3">
          {learners.map((l) => {
            const r = ROLE[l.role];
            return (
              <Link key={l.id} href={`/family/members/${l.id}`} className="bg-card border border-line rounded-card px-4 py-[13px] block">
                <div className="flex items-center gap-3">
                  <Avatar name={l.name} color={l.color} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-ink">{l.name}</span>
                      <Tag tone={r.tone}>{r.label}</Tag>
                    </div>
                    <div className="text-[11.5px] font-bold text-ink-3">{l.level} level · active {l.lastActive.toLowerCase()}</div>
                  </div>
                  <ChevronRight className="text-ink-4" />
                </div>
                <div className="mt-3 flex justify-between text-[12px] font-extrabold text-ink-2">
                  <span>{l.pathTitle}</span>
                  <span className="text-ink-3">{l.pathProgress}%</span>
                </div>
                <ProgressBar value={l.pathProgress} height={6} className="mt-[5px]" />
                <div className="mt-[10px] flex gap-3 text-[12px] font-extrabold text-ink-3">
                  <span>🔥 {l.streak} day streak</span>
                  <span>⭐ {l.weekXp} XP this week</span>
                </div>
                {l.needs.length > 0 && (
                  <div className="mt-[9px] flex flex-wrap items-center gap-[6px]">
                    <span className="text-[11px] font-extrabold text-orange-2">Needs practice:</span>
                    {l.needs.map((n) => (
                      <span key={n} className={cx("rounded-[6px] px-2 py-[3px] text-[10.5px] font-extrabold bg-orange-tint text-orange-2")}>{n}</span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <Link href="/family/invite" className="mt-3 flex items-center justify-center h-[48px] rounded-[14px] border-2 border-dashed border-green-line text-green text-[13.5px] font-black bg-green-tint-2">
          ＋ Add a family member
        </Link>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Parent controls</h2>
        <ParentControls />
        <p className="mt-2 text-[11px] font-bold text-ink-4">You see each learner&apos;s progress without signing in as them.</p>
      </div>
    </div>
  );
}
