import { getUser } from "@/lib/data-live";
import { ProgressBar, cx } from "@/components/ui";
import { EmptyState, StatTile } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { getMyProgress } from "@/lib/live/family";

/** Progress on the member's own `xp_events`, `lesson_progress` and `skill_mastery`. */
export default async function ProgressPage() {
  const [user, p] = await Promise.all([getUser(), getMyProgress()]);
  const pct = Math.round((user.levelXp / Math.max(1, user.levelXpMax)) * 100);
  const max = Math.max(1, ...(p?.week.map((w) => w.xp) ?? [1]));
  const r = 44, c = 2 * Math.PI * r;
  const todayIdx = 6;

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Progress" />
      <div className="px-[18px] pb-6">
        <div className="bg-card border border-line rounded-card px-4 py-4 flex items-center gap-4">
          <svg width="108" height="108" viewBox="0 0 108 108" aria-label={`Level ${user.level}, ${pct}% to next`}>
            <circle cx="54" cy="54" r={r} fill="none" stroke="#F0E6D0" strokeWidth="10" />
            <circle cx="54" cy="54" r={r} fill="none" stroke="#E9B949" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} transform="rotate(-90 54 54)" />
            <text x="54" y="50" textAnchor="middle" fontSize="22" fontWeight="900" fill="#2E2A21">{user.level}</text>
            <text x="54" y="66" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8F8672">LEVEL</text>
          </svg>
          <div className="flex-1">
            <div className="text-[16px] font-black text-ink">{pct}% to Level {user.level + 1}</div>
            <div className="text-[12px] font-bold text-ink-3">{user.levelXp.toLocaleString()} / {user.levelXpMax.toLocaleString()} XP</div>
            <div className="mt-2 flex gap-[6px]">
              <StatTile value={`🔥 ${p?.streakDays ?? user.streakDays}`} label="day streak" />
              <StatTile value={p?.lessons.completed ?? user.lessonsDone} label="lessons" tone="green" />
            </div>
          </div>
        </div>

        {!p ? <div className="mt-5"><EmptyState emoji="📈" title="Sign in to see your progress" action="Sign in" href="/login?next=/profile/progress" /></div> : (
          <>
            <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">This week</h2>
            <div className="bg-card border border-line rounded-card px-4 py-4">
              <div className="flex items-end gap-2 h-[90px]">
                {p.week.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-[9.5px] font-extrabold text-ink-3">{w.xp || ""}</span>
                    <div className={cx("w-full rounded-[5px]", i === todayIdx ? "bg-green-2" : "bg-green-tint border border-green-line")} style={{ height: `${Math.max(w.xp ? 8 : 3, (w.xp / max) * 100)}%` }} />
                    <span className="text-[10px] font-extrabold text-ink-4">{w.d}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[12px] font-bold text-ink-3">{p.weekXp} XP this week{p.bestDay ? ` · best day ${p.bestDay}` : " · earn some today"}</div>
            </div>

            <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Mastery map</h2>
            {p.mastery.length === 0 ? <EmptyState emoji="🧠" title="No mastery yet" body="Mastery counts what you can do, not what you've opened. Finish a lesson with a checkpoint to start the map." action="See paths" href="/learn/library" /> : (
              <div className="bg-card border border-line rounded-card px-4 py-1">
                {p.mastery.map((m, i, arr) => (
                  <div key={m.path} className={cx("block py-3", i < arr.length - 1 && "border-b border-paper-2")}>
                    <div className="flex justify-between text-[12.5px] font-extrabold"><span className="text-ink">{m.path}</span><span className={m.pct >= 70 ? "text-green" : m.pct > 0 ? "text-orange-2" : "text-ink-4"}>{m.pct ? `${m.pct}% mastery` : "Not started"}</span></div>
                    <ProgressBar value={m.pct} height={6} color={m.pct >= 70 ? "bg-green-2" : "bg-orange"} className="mt-[5px]" />
                  </div>
                ))}
              </div>
            )}

            <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Recent learning</h2>
            {p.recent.length === 0 ? <EmptyState emoji="📚" title="Nothing yet" body="Your lessons, quizzes and family nights show up here as you go." action="Start a lesson" href="/learn" /> : (
              <div className="bg-card border border-line rounded-card px-4 py-1">
                {p.recent.map((h, i) => (
                  <div key={h.id} className={cx("flex items-center gap-3 py-[10px]", i < p.recent.length - 1 && "border-b border-paper-2")}>
                    <div className="flex-1 min-w-0"><div className="text-[13px] font-extrabold text-ink truncate">{h.title}</div><div className="text-[11px] font-bold text-ink-3">{h.sub}</div></div>
                    <span className="text-[12px] font-black text-green">+{h.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 text-[11px] font-bold text-ink-4">{p.lessons.completed} of {p.lessons.total} published lessons complete.</div>
          </>
        )}

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Credentials</h2>
        <EmptyState emoji="🎓" title="No credentials yet" body="Finish a full path and its checkpoint to earn a shareable certificate." action="See paths" href="/learn/library" />
      </div>
    </div>
  );
}
