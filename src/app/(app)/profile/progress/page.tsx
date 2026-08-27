import Link from "next/link";
import { getUser, getMastery, getPaths } from "@/lib/data-live";
import { ProgressBar, cx } from "@/components/ui";
import { EmptyState, StatTile } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";

const WEEK = [{ d: "M", xp: 60 }, { d: "T", xp: 40 }, { d: "W", xp: 90 }, { d: "T", xp: 30 }, { d: "F", xp: 110 }, { d: "S", xp: 70 }, { d: "S", xp: 30 }];
const HISTORY = [
  { title: "Why do stock prices move?", path: "Investing Foundations", when: "Today", xp: 10, kind: "In progress" },
  { title: "Checkpoint Quiz 1", path: "Investing Foundations", when: "Yesterday", xp: 40, kind: "Checkpoint · 9/10" },
  { title: "Saving vs. Investing", path: "Investing Foundations", when: "2 days ago", xp: 20, kind: "Lesson" },
  { title: "Diversification in 20 Minutes", path: "Recording", when: "3 days ago", xp: 15, kind: "Recording" },
  { title: "What is Money?", path: "Investing Foundations", when: "4 days ago", xp: 20, kind: "Lesson" },
];

export default async function ProgressPage() {
  const [user, mastery, paths] = await Promise.all([getUser(), getMastery(), getPaths()]);
  const pct = Math.round((user.levelXp / user.levelXpMax) * 100);
  const max = Math.max(...WEEK.map((w) => w.xp));
  const r = 44, c = 2 * Math.PI * r;

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Progress" />
      <div className="px-[18px] pb-6">
        <div className="bg-card border border-line rounded-card px-4 py-4 flex items-center gap-4">
          <svg width="108" height="108" viewBox="0 0 108 108" aria-label={`Level ${user.level}, ${pct}% to next`}>
            <circle cx="54" cy="54" r={r} fill="none" stroke="#F0E6D0" strokeWidth="10" />
            <circle cx="54" cy="54" r={r} fill="none" stroke="#E9B949" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 54 54)" />
            <text x="54" y="50" textAnchor="middle" fontSize="22" fontWeight="900" fill="#2E2A21">{user.level}</text>
            <text x="54" y="66" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8F8672">LEVEL</text>
          </svg>
          <div className="flex-1">
            <div className="text-[16px] font-black text-ink">{pct}% to Level {user.level + 1}</div>
            <div className="text-[12px] font-bold text-ink-3">{user.levelXp.toLocaleString()} / {user.levelXpMax.toLocaleString()} XP</div>
            <div className="mt-2 flex gap-[6px]">
              <StatTile value={`🔥 ${user.streakDays}`} label="streak" />
              <StatTile value={user.lessonsDone} label="lessons" tone="green" />
            </div>
          </div>
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">This week</h2>
        <div className="bg-card border border-line rounded-card px-4 py-4">
          <div className="flex items-end gap-2 h-[90px]">
            {WEEK.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[9.5px] font-extrabold text-ink-3">{w.xp}</span>
                <div className={cx("w-full rounded-[5px]", i === 4 ? "bg-green-2" : "bg-green-tint border border-green-line")} style={{ height: `${(w.xp / max) * 100}%` }} />
                <span className="text-[10px] font-extrabold text-ink-4">{w.d}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[12px] font-bold text-ink-3">{user.weekXp} XP this week · best day Friday</div>
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Mastery map</h2>
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {paths.filter((p) => !p.elective).map((p, i, arr) => {
            const m = mastery.find((x) => x.path === p.title)?.pct ?? 0;
            return (
              <Link key={p.slug} href={`/learn/path/${p.slug}`} className={cx("block py-3", i < arr.length - 1 && "border-b border-paper-2")}>
                <div className="flex justify-between text-[12.5px] font-extrabold">
                  <span className="text-ink">{p.title}</span>
                  <span className={m >= 70 ? "text-green" : m > 0 ? "text-orange-2" : "text-ink-4"}>{m ? `${m}% mastery` : "Not started"}</span>
                </div>
                <ProgressBar value={m} height={6} color={m >= 70 ? "bg-green-2" : "bg-orange"} className="mt-[5px]" />
                <div className="mt-1 text-[10.5px] font-bold text-ink-4">{p.progress}% of lessons complete — mastery counts what you can do, not what you&apos;ve opened.</div>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Recent learning</h2>
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {HISTORY.map((h, i) => (
            <div key={h.title} className={cx("flex items-center gap-3 py-[10px]", i < HISTORY.length - 1 && "border-b border-paper-2")}>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-extrabold text-ink truncate">{h.title}</div>
                <div className="text-[11px] font-bold text-ink-3">{h.path} · {h.kind} · {h.when}</div>
              </div>
              <span className="text-[12px] font-black text-green">+{h.xp} XP</span>
            </div>
          ))}
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Credentials</h2>
        <EmptyState emoji="🎓" title="No credentials yet" body="Finish a full path and its checkpoint to earn a shareable certificate." action="See paths" href="/learn/library" />
      </div>
    </div>
  );
}
