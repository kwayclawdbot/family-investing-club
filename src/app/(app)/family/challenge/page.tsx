import Link from "next/link";
import { notFound } from "next/navigation";
import { getChallenge, getFamily, getLiveSession } from "@/lib/data-live";
import { ArtPlaceholder, ButtonLink, Tag } from "@/components/ui";
import { StatTile } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { ChallengeChecklist } from "@/components/family/ChallengeChecklist";

const PROMPTS = ["What does this company sell?", "Who are its customers?", "How does it make money?", "What could go wrong for it?"];

function ics(title: string, startIso: string, minutes: number) {
  const s = new Date(startIso); const e = new Date(s.getTime() + minutes * 60000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return "data:text/calendar;charset=utf8," + encodeURIComponent(`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${f(s)}\nDTEND:${f(e)}\nEND:VEVENT\nEND:VCALENDAR`);
}

export default async function FamilyChallengePage() {
  const [challenge, family, night] = await Promise.all([getChallenge("family-brand-research"), getFamily(), getLiveSession("family-investing-night")]);
  if (!challenge) notFound();
  const when = night ? new Date(night.startsAt).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) : "Thursday, 7:00 PM";

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/family" title="This week's challenge" />
      <div className="px-[18px] pb-6">
        <div className="bg-card border border-line rounded-card px-4 py-4">
          <div className="flex items-center gap-2">
            <Tag tone="orange">FAMILY CHALLENGE</Tag>
            <span className="text-[11px] font-extrabold text-ink-3">due {challenge.due}</span>
          </div>
          <div className="mt-2 flex gap-3">
            <h1 className="flex-1 text-[19px] font-black text-ink leading-[1.25]">{challenge.title}</h1>
            <ArtPlaceholder className="w-[68px] h-[68px] shrink-0" />
          </div>
          <p className="mt-2 text-[13px] font-bold text-ink-2 leading-[1.5]">{challenge.blurb}</p>
        </div>

        <div className="mt-3 flex gap-[9px]">
          <StatTile value={`+${challenge.xp}`} label="XP each" tone="orange" />
          <StatTile value={challenge.participants} label="taking part" tone="green" />
          <StatTile value={`${challenge.progress}%`} label="family done" />
        </div>

        <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Do it together</h2>
        <ChallengeChecklist challenge={challenge} members={family.members} />

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Family Investing Night</h2>
        <div className="bg-purple-tint border border-purple-line rounded-card px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[26px]">🌙</span>
            <div className="flex-1">
              <div className="text-[14px] font-black text-ink">{when}</div>
              <div className="text-[12px] font-bold text-purple-2">45 min · with Coach Marcus · bring the kids</div>
            </div>
          </div>
          <div className="mt-3 bg-card rounded-[12px] px-3 py-3">
            <div className="text-[11px] font-black text-purple-2 tracking-[0.5px]">TALK ABOUT IT</div>
            <ol className="mt-1 flex flex-col gap-[6px]">
              {PROMPTS.map((p, i) => (
                <li key={p} className="flex gap-2 text-[13px] font-bold text-ink-2"><span className="font-black text-purple-2">{i + 1}.</span>{p}</li>
              ))}
            </ol>
          </div>
          <div className="mt-3 flex gap-2">
            <a href={night ? ics(night.title, night.startsAt, night.minutes) : "#"} download="family-investing-night.ics"
              className="flex-1 h-[40px] rounded-[12px] bg-card border border-purple-line text-purple-2 text-[13px] font-black flex items-center justify-center">Add to calendar</a>
            <ButtonLink href="/learn/games/family-brand-hunt" size="md" variant="purple" className="flex-1">Start the night</ButtonLink>
          </div>
          {night && <Link href={`/live/${night.id}`} className="block mt-2 text-center text-[12px] font-extrabold text-purple-2">Session details ›</Link>}
        </div>
      </div>
    </div>
  );
}
