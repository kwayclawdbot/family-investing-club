import Link from "next/link";
import { getUser, getReputation, beltFor, nextBelt, getSpecialistBadges, getAchievementsCount, getResearchCount, getMyPicksSummary } from "@/lib/data-live";
import { BeltRing } from "@/components/ui/belt";
import { VerificationRow } from "@/components/belts/VerificationRow";

const SWATCH: Record<string, string> = { white: "bg-white border border-[#E6DFCF]", yellow: "bg-[#E9B949]", blue: "bg-[#3E7BC7]", purple: "bg-[#8B7BC7]", black: "bg-[#2E2A21]" };

/** v12 — Me answers one question: my record. Performance detail lives in /profile/performance. */
export default async function ProfilePage() {
  const [user, rep, specialties, achievements, research, picks] = await Promise.all([
    getUser(), getReputation(), getSpecialistBadges(), getAchievementsCount(), getResearchCount(), getMyPicksSummary(),
  ]);
  const xp = user.levelXp;
  const belt = beltFor(xp); const next = nextBelt(xp);
  const toNext = next ? next.minXp - xp : 0;
    const row = "flex justify-between items-center py-[11px] border-b border-paper-2 text-[13px] font-extrabold text-ink";
  return (
    <div className="pt-[14px] pb-6">
      <h1 className="text-[21px] font-black text-ink">Me</h1>
      <div className="flex flex-col items-center mt-1">
        <BeltRing belt={belt} width={3} className="!ring-offset-[#FFFDF7]"><span className="w-[76px] h-[76px] rounded-full bg-green-2 text-white flex items-center justify-center text-[28px] font-black" aria-hidden>{user.firstName[0]}</span></BeltRing>
        <h1 className="mt-[9px] text-[20px] font-black text-ink">{user.firstName} {user.lastName}</h1>
        <Link href="/profile/belt?preview=1" className="mt-[5px] inline-flex items-center gap-[7px] bg-[#FFFDF7] border border-[#E0D5BE] rounded-[10px] px-3 py-[5px]"><span className={`w-[26px] h-2 rounded-[4px] ${SWATCH[belt.color]}`} /><span className="text-[12.5px] font-black text-[#4A4436]">{belt.label} · {xp.toLocaleString()} XP</span></Link>
        <div className="mt-1 text-[10.5px] font-extrabold text-ink-3">{next ? `${toNext.toLocaleString()} XP to ${next.label}` : "Black Belt · apex"}</div>
      </div>
      <div className="mt-[14px] mb-[6px] text-[11px] font-black text-ink-3">MY RECORD</div>
      <div className="flex gap-2">
        {[[rep.resolvedPicks ? `${rep.pickPositivePct}%` : "—", "PICK ACCURACY", "text-green"], [picks.ytdPct === null ? "—" : `${picks.ytdPct >= 0 ? "+" : ""}${picks.ytdPct}%`, "PICKS YTD", picks.ytdPct !== null && picks.ytdPct < 0 ? "text-coral-2" : "text-[#3A8C4A]"], [String(research), "RESEARCH", "text-ink"]].map(([v, l, c]) => (
          <div key={l} className="flex-1 bg-card border border-line rounded-[13px] p-[10px] text-center"><div className={`text-[16px] font-black ${c}`}>{v}</div><div className="text-[8.5px] font-extrabold text-ink-3">{l}</div></div>
        ))}
      </div>
      <div className="mt-[10px] bg-card border border-line rounded-[15px] px-[15px] py-[3px]">
        <VerificationRow />
        <div className="flex justify-between items-center py-[10px] border-b border-paper-2"><span className="text-[12.5px] font-extrabold text-ink">Specialist badges</span><span className="text-[11px] font-extrabold text-purple-2">{specialties.length ? specialties.join(" · ") : "None yet"}</span></div>
        <Link href="/profile/badges" className="flex justify-between items-center py-[10px]"><span className="text-[12.5px] font-extrabold text-ink">Achievements</span><span className="text-[11.5px] font-extrabold text-ink-3">{achievements} ›</span></Link>
      </div>
      <div className="mt-[10px] bg-card border border-line rounded-[15px] px-[15px] py-[3px]">
        <Link href="/profile/performance" className={row}><span>📈 My Performance</span><span className="text-ink-4">›</span></Link>
        <Link href="/discover/watchlist" className={row}><span>🔖 Saved</span><span className="text-ink-4">›</span></Link>
        <Link href="/kai" className={row}><span>✦ Ask — Kai chat</span><span className="text-ink-4">›</span></Link>
        <Link href="/profile/settings" className="flex justify-between items-center py-[11px] text-[13px] font-extrabold text-ink"><span>⚙️ Settings</span><span className="text-ink-4">›</span></Link>
      </div>
      <div className="mt-[10px] bg-card border border-line rounded-[15px] px-[15px] py-[3px]">
        {[["👨‍👩‍👧‍👦 Family", "/family"], ["🔔 Notifications", "/profile/notifications"], ["💳 Billing & plan", "/profile/billing"], ["🎁 Invite friends", "/profile/referrals"], ["❓ Help", "/profile/help"]].map(([l, h], i, a) => (
          <Link key={h} href={h} className={`flex justify-between items-center py-[10px] text-[12.5px] font-extrabold text-ink ${i < a.length - 1 ? "border-b border-paper-2" : ""}`}><span>{l}</span><span className="text-ink-4">›</span></Link>
        ))}
      </div>
    </div>
  );
}
