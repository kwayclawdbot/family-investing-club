import { getUser, getFamily, getBadges, getMastery } from "@/lib/data";
import { cx } from "@/components/ui";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

const BADGE_STYLE: Record<string, string> = {
  b1: "bg-green-tint border-2 border-green-2",
  b2: "bg-orange-tint border-2 border-orange",
  b3: "bg-[#FFFDF4] border-2 border-gold",
  b4: "bg-line-2 border-2 border-dashed border-[#C9BC9E]",
};
const LOCKED = new Set(["b4"]);

export default async function ProfilePage() {
  const [user, family, badges, mastery] = await Promise.all([getUser(), getFamily(), getBadges(), getMastery()]);
  const levelPct = Math.round((user.levelXp / user.levelXpMax) * 100);
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center gap-[14px]">
        <span className="w-[60px] h-[60px] rounded-full bg-green-2 text-white flex items-center justify-center text-[24px] font-black border-[3px] border-gold shrink-0" aria-hidden>
          {user.firstName[0]}
        </span>
        <div className="flex-1">
          <h1 className="text-[20px] font-black text-ink leading-tight">{user.firstName} {user.lastName}</h1>
          <div className="text-[12.5px] font-extrabold text-ink-3">
            Level {user.level} · <span className="text-green">{user.explanationLevel}</span> explanation level
          </div>
        </div>
      </div>

      <div className="mt-3 bg-card border border-line rounded-[14px] px-[15px] py-3">
        <div className="flex justify-between text-[12px] font-extrabold text-ink-3">
          <span>Level {user.level}</span>
          <span>{fmt(user.levelXp)} / {fmt(user.levelXpMax)} XP</span>
        </div>
        <div className="h-2 rounded-[4px] bg-line-2 mt-[7px] overflow-hidden" role="progressbar" aria-valuenow={levelPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-[4px] bg-gold" style={{ width: `${levelPct}%` }} />
        </div>
      </div>

      <div className="flex gap-[9px] mt-[11px]">
        {[
          [String(user.weekXp), "XP this week"],
          [`🔥 ${user.streakDays}`, "day streak"],
          [String(user.lessonsDone), "lessons done"],
        ].map(([v, l]) => (
          <div key={l} className="flex-1 bg-card border border-line rounded-[14px] px-2 py-[11px] text-center">
            <div className="text-[17px] font-black text-ink">{v}</div>
            <div className="text-[10.5px] font-extrabold text-ink-3">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-[14px] mb-2">
        <h2 className="text-[15px] font-black text-ink">Badges</h2>
        <span className="text-[12px] font-extrabold text-green">All badges</span>
      </div>
      <div className="flex gap-3">
        {badges.map((b) => (
          <div key={b.id} className={cx("flex-1 flex flex-col items-center gap-[5px]", LOCKED.has(b.id) && "opacity-45")}>
            <span className={cx("w-[52px] h-[52px] rounded-full flex items-center justify-center text-[21px]", BADGE_STYLE[b.id])}>{b.emoji}</span>
            <span className="text-[9.5px] font-extrabold text-ink-2 text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-[14px] mb-2 text-[15px] font-black text-ink">Concept Mastery</h2>
      <div className="bg-card border border-line rounded-card px-4 py-[13px] flex flex-col gap-[10px]">
        {mastery.map((m) => {
          const strong = m.pct >= 70;
          return (
            <div key={m.path}>
              <div className="flex justify-between text-[12.5px] font-extrabold text-ink">
                <span>{m.path}</span>
                <span className={strong ? "text-green" : "text-orange-2"}>{m.pct}%</span>
              </div>
              <div className="h-[6px] rounded-[3px] bg-line-2 mt-[5px] overflow-hidden">
                <div className={cx("h-full rounded-[3px]", strong ? "bg-green-2" : "bg-orange")} style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <ProfileSettings familyName={family.name} initialLevel={user.explanationLevel} />
    </div>
  );
}
