import Link from "next/link";
import { getFamily } from "@/lib/data";
import { Avatar, ArtPlaceholder, cx } from "@/components/ui";
import { SettingsIcon } from "@/components/ui/icons";
import { InviteRow } from "@/components/family/InviteRow";

export default async function FamilyPage() {
  const family = await getFamily();
  const top = Math.max(...family.members.map((m) => m.xp), 1);
  const bar = (color: string) => color; // member colour doubles as the bar colour

  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[21px] font-black text-ink leading-tight">{family.name}</h1>
          <div className="text-[12.5px] font-bold text-ink-3">{family.members.length} members</div>
        </div>
        <Link href="/profile" aria-label="Family settings" className="text-ink-3">
          <SettingsIcon size={20} />
        </Link>
      </div>

      <div className="mt-3 bg-orange-tint border border-orange-line rounded-card px-4 py-[14px] flex items-center gap-[13px]">
        <span className="text-[30px]">🔥</span>
        <div>
          <div className="text-[12px] font-extrabold text-orange-2">FAMILY STREAK</div>
          <div className="text-[19px] font-black text-ink leading-tight">{family.streakWeeks} weeks</div>
          <div className="text-[11.5px] font-bold text-orange-2">Keep going strong!</div>
        </div>
      </div>

      <div className="mt-3 bg-card border border-line rounded-card px-4 py-[14px]">
        <div className="text-[11.5px] font-black text-orange tracking-[0.5px]">THIS WEEK&apos;S CHALLENGE</div>
        <div className="flex gap-3 mt-[7px] items-center">
          <div className="flex-1">
            <div className="text-[14px] font-extrabold text-ink leading-[1.35]">{family.weeklyChallenge.title}</div>
            <Link href="/markets" className="mt-[9px] inline-block bg-green-2 text-cream-text rounded-[11px] px-[14px] py-[7px] text-[12px] font-black">
              View Challenge
            </Link>
          </div>
          <ArtPlaceholder className="w-[74px] h-[74px] shrink-0" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-[14px] mb-2">
        <h2 className="text-[15px] font-black text-ink">This Week&apos;s Progress</h2>
        <span className="text-[11px] font-bold text-ink-4">weekly XP</span>
      </div>
      <div className="bg-card border border-line rounded-card px-4 py-[6px]">
        {family.members.map((m, i) => (
          <div key={m.id} className={cx("flex items-center gap-[11px] py-[10px]", i < family.members.length - 1 && "border-b border-paper-2")}>
            <Avatar name={m.name} color={m.isYou ? "bg-green-2" : m.color} size={32} />
            <div className="flex-1">
              <div className="flex justify-between text-[13px] font-extrabold text-ink">
                <span>{m.name}{m.isYou ? " (you)" : ""}</span>
                <span className="text-ink-3">{m.xp} XP</span>
              </div>
              <div className="h-[6px] rounded-[3px] bg-line-2 mt-[5px] overflow-hidden">
                <div className={cx("h-full rounded-[3px]", m.isYou ? "bg-green-2" : bar(m.color))} style={{ width: `${Math.round((m.xp / top) * 86)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/practice" className="mt-3 bg-card border border-line rounded-card px-4 py-[13px] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-extrabold text-ink-3">Family Portfolio (Practice)</div>
          <div className="text-[19px] font-black text-ink">
            ${family.portfolio.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[14px] font-black text-[#3A8C4A]">+{family.portfolio.ytdPct.toFixed(2)}%</div>
          <div className="text-[11px] font-extrabold text-ink-3">YTD Return</div>
        </div>
      </Link>

      <InviteRow code={family.inviteCode} />
    </div>
  );
}
