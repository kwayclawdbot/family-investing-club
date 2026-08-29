import Link from "next/link";
import { cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { SettingsIcon } from "@/components/ui/icons";
import { InviteRow } from "@/components/family/InviteRow";
import { MemberAvatar } from "@/components/family/MemberAvatar";
import { ActivityPing } from "@/components/family/ActivityPing";
import { getFamilyInvites, getFamilyWatchlist, getGuardrailsForKids, getHousehold, guardrailSummary } from "@/lib/live/family";
import { getSession } from "@/lib/live/session";

/** The household on FTA's real tables. Parents manage; kids get the same page read-only (no invites, no controls). */
export default async function FamilyPage() {
  const [s, family] = await Promise.all([getSession(), getHousehold()]);
  if (!s) return <div className="pt-[14px] pb-6"><h1 className="text-[21px] font-black text-ink">Family</h1><div className="mt-3"><EmptyState emoji="👨‍👩‍👧‍👦" title="Sign in to see your family" body="Your household, everyone's progress and Family Investing Night live here." action="Sign in" href="/login?next=/family" /></div></div>;
  if (!family) return <div className="pt-[14px] pb-6"><h1 className="text-[21px] font-black text-ink">Family</h1><div className="mt-3"><EmptyState emoji="🏡" title="No household yet" body="Create your family to invite kids and learn together." action="Set up my family" href="/onboarding/who" /></div></div>;

  const [watch, guards, invites] = await Promise.all([getFamilyWatchlist(), getGuardrailsForKids(), family.isParent ? getFamilyInvites() : Promise.resolve(null)]);
  const research = watch?.entries.slice(0, 2) ?? [];
  const top = Math.max(...family.members.map((m) => m.weekXp), 1);
  const activeToday = family.members.filter((m) => m.activeToday).length;
  const openInvite = invites?.find((i) => !i.used && !i.expired) ?? null;

  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[21px] font-black text-ink leading-tight">{family.name}</h1>
          <div className="text-[12.5px] font-bold text-ink-3">{family.members.length} member{family.members.length === 1 ? "" : "s"}{family.kids.length ? ` · ${family.kids.length} learner${family.kids.length === 1 ? "" : "s"}` : ""}</div>
        </div>
        {family.isParent && <Link href="/family/members" aria-label="Manage family" className="text-ink-3"><SettingsIcon size={20} /></Link>}
      </div>
      <ActivityPing active={family.isKid} />

      <div className="mt-3 bg-orange-tint border border-orange-line rounded-card px-4 py-[14px] flex items-center gap-[13px]">
        <span className="text-[30px]">🔥</span>
        <div>
          <div className="text-[12px] font-extrabold text-orange-2">FAMILY XP THIS WEEK</div>
          <div className="text-[19px] font-black text-ink leading-tight">{family.weekXp.toLocaleString()} XP</div>
          <div className="text-[11.5px] font-bold text-orange-2">{activeToday ? `${activeToday} of ${family.members.length} active today` : "Nobody's learned yet today — a lesson each keeps it going"}</div>
        </div>
      </div>

      <Link href="/family/night" className="mt-3 bg-purple-tint border border-purple-line rounded-card px-4 py-[12px] flex items-center gap-3">
        <span className="text-[22px]">🌙</span>
        <div className="flex-1">
          <div className="text-[13px] font-black text-ink">Family Investing Night</div>
          <div className="text-[12px] font-bold text-purple-2">{watch?.leader ? `Tonight's pick: ${watch.leader.ticker} · ${watch.leader.votes} vote${watch.leader.votes === 1 ? "" : "s"}` : "Vote on a company, talk it through, everyone earns XP"}</div>
        </div>
        <span className="text-ink-4">›</span>
      </Link>

      <div className="flex items-baseline justify-between mt-[14px] mb-2">
        <h2 className="text-[15px] font-black text-ink">This Week&apos;s Progress</h2>
        <span className="text-[11px] font-bold text-ink-4">weekly XP</span>
      </div>
      <div className="bg-card border border-line rounded-card px-4 py-[6px]">
        {family.members.map((m, i) => {
          const g = m.isKid ? guards.get(m.id) : null;
          const inner = (
            <>
              <MemberAvatar name={m.name} color={m.isYou ? "bg-green-2" : m.color} avatarUrl={m.avatarUrl} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[13px] font-extrabold text-ink">
                  <span className="truncate">{m.name}{m.isYou ? " (you)" : ""}{m.isKid ? <span className="ml-[6px] text-[10px] font-extrabold text-purple-2">{m.level}</span> : null}</span>
                  <span className="text-ink-3 shrink-0">{m.weekXp} XP</span>
                </div>
                <div className="h-[6px] rounded-[3px] bg-line-2 mt-[5px] overflow-hidden">
                  <div className={cx("h-full rounded-[3px]", m.isYou ? "bg-green-2" : m.color)} style={{ width: `${Math.round((m.weekXp / top) * 86)}%` }} />
                </div>
                <div className="mt-[3px] text-[10.5px] font-bold text-ink-4 truncate">{m.activeDaysThisWeek ? `${m.activeDaysThisWeek} active day${m.activeDaysThisWeek === 1 ? "" : "s"} · ` : ""}{m.lastActive}{g && family.isParent ? ` · ${guardrailSummary(g).slice(1, 3).join(" · ")}` : ""}</div>
              </div>
              {family.isParent && !m.isYou && <span className="text-ink-4">›</span>}
            </>
          );
          const cls = cx("flex items-center gap-[11px] py-[10px]", i < family.members.length - 1 && "border-b border-paper-2");
          return family.isParent && !m.isYou ? <Link key={m.id} href={`/family/members/${m.id}`} className={cls}>{inner}</Link> : <div key={m.id} className={cls}>{inner}</div>;
        })}
      </div>

      <Link href="/family/challenge" className="mt-3 bg-card border border-line rounded-card px-4 py-[13px] flex items-center justify-between">
        <div>
          <div className="text-[11.5px] font-black text-orange tracking-[0.5px]">FAMILY MISSIONS</div>
          <div className="text-[14px] font-extrabold text-ink">Things to do together this week</div>
        </div>
        <span className="text-ink-4">›</span>
      </Link>

      <Link href="/family/research" className="mt-3 bg-card border border-line rounded-card px-4 py-[13px] block">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-black text-ink">Family research list</div>
          <span className="text-[12px] font-extrabold text-green">{watch?.entries.length ? "See all ›" : "Add one ›"}</span>
        </div>
        {research.length === 0 && <div className="mt-2 text-[12px] font-bold text-ink-3">No companies yet — add a brand you all use.</div>}
        {research.map((r, i) => (
          <div key={r.id} className={cx("flex items-center gap-3 py-[9px]", i < research.length - 1 && "border-b border-paper-2")}>
            <span className="w-9 h-9 rounded-[10px] bg-green-tint text-green text-[10.5px] font-black flex items-center justify-center">{r.ticker}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold text-ink truncate">{r.name}</div>
              <div className="text-[11.5px] font-bold text-ink-3 truncate">{r.why || `${r.champion} added it`}{r.votes ? ` · ${r.votes} vote${r.votes === 1 ? "" : "s"} tonight` : ""}</div>
            </div>
          </div>
        ))}
      </Link>

      {family.isParent && (openInvite ? <InviteRow code={openInvite.code} manageHref="/family/invite" /> : (
        <Link href="/family/invite" className="mt-3 flex items-center justify-center h-[46px] rounded-[14px] border-2 border-dashed border-green-line text-green text-[13px] font-black bg-green-tint-2">＋ Invite a family member</Link>
      ))}
      {family.isKid && <p className="mt-3 text-[11px] font-bold text-ink-4 text-center">Your grown-ups manage the household. You can vote, do missions and add companies to research.</p>}
    </div>
  );
}
