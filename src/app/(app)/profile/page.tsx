import Link from "next/link";
import { getUser, getFamily, getRecentXp, getReputation, identityOf, beltFor, nextBelt, specialistBadges, achievementsCount } from "@/lib/data-live";
import { BeltChip, BeltRing } from "@/components/ui/belt";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { BeltProgress } from "@/components/belts/BeltProgress";
import { VerificationRow } from "@/components/belts/VerificationRow";

/**
 * Profile — belt-first (canvas v8, artboard 01). Five identity systems, kept separate:
 * Belt · Reputation (pick record) · Specialist badges · Verification · Achievements.
 */
export default async function ProfilePage() {
  const [user, family, recent, rep] = await Promise.all([getUser(), getFamily(), getRecentXp(), getReputation()]);
  const identity = identityOf("kway");
  const xp = identity?.lifetimeXp ?? 0;
  const belt = beltFor(xp);
  const next = nextBelt(xp);

  return (
    <div className="pt-[14px] pb-6">
      {/* belt-first identity */}
      <div className="flex flex-col items-center text-center mt-1">
        <BeltRing belt={belt} width={3} className="!ring-offset-[#FFFDF7]">
          <span className="w-[72px] h-[72px] rounded-full bg-green-2 text-white flex items-center justify-center text-[27px] font-black" aria-hidden>
            {user.firstName[0]}
          </span>
        </BeltRing>
        <h1 className="mt-[9px] text-[20px] font-black text-ink">{user.firstName} {user.lastName}</h1>
        <Link href="/profile/belt?preview=1" className="mt-[6px] inline-flex items-center gap-[7px] bg-[#FFFDF7] border border-[#E0D5BE] rounded-[10px] px-3 py-[5px]" aria-label="Your belt">
          <BeltChip belt={belt} size="md" className="!border-0 !bg-transparent !px-0 !text-[12.5px] !text-[#4A4436]" />
          <span className="text-[12.5px] font-black text-[#4A4436]">· {xp.toLocaleString()} XP</span>
        </Link>
      </div>

      <BeltProgress xp={xp} belt={belt} next={next} href="/profile/belt?preview=1" />

      <div className="mt-[11px] text-[11px] font-black text-ink-3">SEPARATE EVIDENCE LAYERS</div>
      <div className="mt-[7px] bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
        <VerificationRow />
        <Link href="/club/leaderboards" className="flex justify-between items-center py-[10px] border-b border-paper-2">
          <span className="text-[12.5px] font-extrabold text-ink">Pick record</span>
          <span className="text-[12px] font-black text-green">{rep.pickPositivePct}% positive outcomes</span>
        </Link>
        <div className="flex justify-between items-center py-[10px] border-b border-paper-2">
          <span className="text-[12.5px] font-extrabold text-ink">Specialist badges</span>
          <span className="text-[11px] font-extrabold text-purple-2">{specialistBadges.join(" · ")}</span>
        </div>
        <Link href="/profile/badges" className="flex justify-between items-center py-[10px]">
          <span className="text-[12.5px] font-extrabold text-ink">Achievements</span>
          <span className="text-[12px] font-extrabold text-ink-3">{achievementsCount} ›</span>
        </Link>
      </div>

      <div className="mt-[11px] flex items-center justify-between">
        <span className="text-[11px] font-black text-ink-3">RECENT XP</span>
        <Link href="/club/xp" className="text-[11px] font-extrabold text-green">See the XP board ›</Link>
      </div>
      <div className="mt-[7px] bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
        {recent.map((e, i) => (
          <div key={e.id} className={`flex justify-between py-[9px] text-[12px] font-bold text-[#4A4436] ${i < recent.length - 1 ? "border-b border-paper-2" : ""}`}>
            <span>{e.emoji} {e.text}</span>
            <span className="text-green font-black">+{e.xp}</span>
          </div>
        ))}
      </div>
      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">More trades, bigger accounts and bigger risks never earn XP</p>

      <Link href="/profile/progress" className="mt-3 flex items-center justify-between bg-card border border-line rounded-[14px] px-[15px] py-3">
        <span className="text-[12.5px] font-extrabold text-ink">Progress &amp; mastery</span>
        <span className="text-[12px] font-extrabold text-ink-3">Level {user.level} · {user.explanationLevel} ›</span>
      </Link>

      <ProfileSettings familyName={family.name} level={user.explanationLevel} />
    </div>
  );
}
