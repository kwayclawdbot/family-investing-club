import Link from "next/link";
import { redirect } from "next/navigation";
import { cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { MemberAvatar } from "@/components/family/MemberAvatar";
import { MemberActions } from "@/components/family/MemberActions";
import { getGuardrailsForKids, getHousehold, guardrailSummary } from "@/lib/live/family";

/** Manage Family (parents): the roster on `profiles`, guardrail line per learner, edit / remove, invite. */
export default async function FamilyMembersPage() {
  const family = await getHousehold();
  if (!family) redirect("/family");
  if (!family.isParent) redirect("/family");
  const guards = await getGuardrailsForKids();
  const ROLE: Record<string, string> = { parent: "Parent", admin: "Parent · admin", coach: "Coach", child: "Child" };

  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <Link href="/family" aria-label="Back" className="text-ink-3 -ml-1"><ChevronLeft size={20} /></Link>
        <span className="text-[15px] font-black text-ink">Manage Family</span>
        <Link href="/family/invite" className="border-[1.5px] border-green-2 text-green rounded-[10px] px-3 py-[6px] text-[11px] font-black">+ Invite</Link>
      </div>
      <p className="mt-[10px] text-[12px] font-extrabold text-ink-3">You see progress — you never log in as them.</p>

      <div className="mt-[10px] flex flex-col gap-[10px]">
        {family.members.map((m) => {
          const g = m.isKid ? guards.get(m.id) : null;
          const meta = [m.isKid ? `${m.ageGroup === "kids" ? "Kid" : "Teen"} · ${m.level}` : ROLE[m.role] ?? m.role, `${m.lifetimeXp.toLocaleString()} XP`, m.lastActive].join(" · ");
          return (
            <div key={m.id} className="bg-card border border-line rounded-[16px] px-4 py-[13px]">
              <div className="flex items-center gap-3">
                <Link href={m.isYou ? "/profile/progress" : `/family/members/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <MemberAvatar name={m.name} color={m.color} avatarUrl={m.avatarUrl} size={40} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-black text-ink truncate">{m.fullName}{m.isYou ? " (you)" : ""}</span>
                    <span className="block text-[11px] font-bold text-ink-3 truncate">{meta}</span>
                  </span>
                  <ChevronRight className="text-ink-4" />
                </Link>
                {!m.isYou && <MemberActions member={m} />}
              </div>
              {g && (
                <div className="mt-[9px] flex flex-wrap gap-[5px]">
                  {guardrailSummary(g).map((t) => <span key={t} className={cx("rounded-[6px] px-2 py-[3px] text-[10px] font-extrabold", t.startsWith("No ") || t.startsWith("Chat not") ? "bg-paper-2 text-ink-3" : "bg-purple-tint text-purple-2")}>{t}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Link href="/family/invite" className="mt-3 flex items-center justify-center h-[46px] rounded-[14px] border-2 border-dashed border-green-line text-green text-[13px] font-black bg-green-tint-2">
        ＋ Add a family member or child profile
      </Link>

      {family.kids.length === 0 && <div className="mt-4"><EmptyState emoji="🧒" title="No learners yet" body="Invite a child or teen — their account is protected from day one: practice money only, family chat only, guardian controls." action="Invite a learner" href="/family/invite" /></div>}
      <p className="mt-4 text-[11px] font-bold text-ink-4">Children keep a protected account: practice money only, no public community, guardrails per learner. Tap a learner for their report and controls.</p>
    </div>
  );
}
