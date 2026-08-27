import Link from "next/link";
import { Avatar, ButtonLink, Card, ProgressBar, SectionHeader, ArtPlaceholder, Row } from "@/components/ui";
import { BellIcon, ClockIcon } from "@/components/ui/icons";
import { KaiFab } from "@/components/shell/KaiFab";
import { Greeting } from "@/components/home/Greeting";
import { getContinueLesson, getFamily, getLeague, getUser } from "@/lib/data";

export default async function HomePage() {
  const [user, family, league, next] = await Promise.all([getUser(), getFamily(), getLeague(), getContinueLesson()]);
  const goalPct = (user.todayXp / user.dailyGoalXp) * 100;

  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <Greeting name={user.firstName} />
        <Link
          href="/profile"
          aria-label="Notifications"
          className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2"
        >
          <BellIcon />
        </Link>
      </div>

      {/* Family streak */}
      <Card tone="orange" className="mt-3 flex items-center gap-3 px-4 py-[13px]">
        <span className="text-[26px] leading-none">🔥</span>
        <div className="flex-1">
          <div className="text-[15px] font-black text-ink">{family.streakDays} Day Family Streak</div>
          <div className="text-[12px] font-bold text-orange-2">Keep it up! You&apos;re on fire.</div>
        </div>
        <span className="text-[20px] leading-none">🔥</span>
      </Card>

      {/* Continue learning */}
      <SectionHeader title="Continue Learning" />
      <Card className="rounded-card-lg">
        <div className="text-[11.5px] font-extrabold text-orange tracking-[0.3px] uppercase">{next.pathTitle}</div>
        <div className="text-[12px] font-bold text-ink-3 mt-[2px]">
          Lesson {next.lessonNo} of {next.lessonTotal}
        </div>
        <div className="flex gap-3 items-center mt-[6px]">
          <div className="flex-1 text-[19px] font-black text-ink leading-[1.25]">{next.title}</div>
          <ArtPlaceholder round className="w-16 h-16 shrink-0" />
        </div>
        <ProgressBar value={next.progress} className="mt-3" />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-[5px] text-[12px] font-extrabold text-ink-3">
            <ClockIcon /> {next.minutes} MIN
          </div>
          <ButtonLink href={`/lesson/${next.lessonId}`} size="md">
            Continue →
          </ButtonLink>
        </div>
      </Card>

      {/* Today's goal */}
      <Card className="mt-3 px-4 py-[13px]">
        <div className="flex items-center justify-between">
          <div className="text-[13.5px] font-black text-ink">Today&apos;s Goal</div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-extrabold text-ink-3">
              {user.todayXp} / {user.dailyGoalXp} XP
            </span>
            <span className="text-[17px] leading-none">⭐</span>
          </div>
        </div>
        <ProgressBar value={goalPct} color="bg-purple" height={8} className="mt-[9px]" />
      </Card>

      {/* Family league */}
      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-[15px] font-black text-ink">
          Family League <span className="text-[11px] font-bold text-ink-4 ml-1">All-time</span>
        </h2>
        <Link href="/family" className="text-[12px] font-extrabold text-green">
          View All
        </Link>
      </div>
      <Card className="py-[6px] px-4">
        {league.map((m, i) => (
          <Row key={m.name} last={i === league.length - 1}>
            <span className="text-[14px] leading-none">{m.medal}</span>
            <Avatar name={m.name} color={m.color} />
            <span className="flex-1 text-[14px] font-extrabold text-ink">{m.name}</span>
            <span className="text-[13px] font-extrabold text-ink-3">{m.xp.toLocaleString()} XP</span>
          </Row>
        ))}
      </Card>

      <KaiFab context="home" />
    </div>
  );
}
