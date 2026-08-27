import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Avatar, Button, ButtonLink, Card, Tag } from "@/components/ui";
import { ConceptChip } from "@/components/ui/extras";
import { Reminder } from "@/components/live/Reminder";
import { whenLabel } from "@/components/live/format";
import { getLiveSession, getPath } from "@/lib/data";

export default async function SessionPage(props: PageProps<"/live/[id]">) {
  const { id } = await props.params;
  const s = await getLiveSession(id);
  if (!s) notFound();
  const path = s.pathSlug ? await getPath(s.pathSlug) : undefined;

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/live" title={s.status === "live" ? "Live" : s.status === "upcoming" ? "Upcoming" : "Recording"} />
      <div className="px-[18px] pb-6">
        {s.status === "live" && (
          <div className="rounded-[18px] bg-[#2E2A21] aspect-video flex flex-col items-center justify-center text-center px-6">
            <span className="inline-flex items-center rounded-[6px] bg-green px-2 py-[3px] text-[10px] font-black text-cream-text">● LIVE · {s.watching} watching</span>
            <p className="mt-3 text-[12.5px] font-bold text-[#D9CDB2] leading-[1.5]">Live sessions stream here — join from the app when the FTA live engine is wired.</p>
          </div>
        )}
        {s.status === "recorded" && (
          <div className="rounded-[18px] bg-[#2E2A21] aspect-video flex flex-col items-center justify-center text-center">
            <span className="w-14 h-14 rounded-full bg-cream-text/15 flex items-center justify-center" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFCF5"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <p className="mt-3 text-[12px] font-extrabold text-[#D9CDB2]">Recording · {s.minutes} min</p>
          </div>
        )}
        {s.status === "upcoming" && (
          <Card tone="green" className="text-center">
            <div className="text-[11px] font-extrabold text-green uppercase tracking-[0.3px]">Starts</div>
            <div className="text-[22px] font-black text-ink mt-1">{whenLabel(s.startsAt)}</div>
            <div className="text-[12.5px] font-bold text-ink-3">{s.minutes} minutes</div>
          </Card>
        )}

        <h1 className="mt-4 text-[22px] font-black text-ink leading-[1.25]">{s.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <Avatar name={s.instructor.replace("Coach ", "")} color="bg-coral" size={36} />
          <div className="flex-1"><div className="text-[13.5px] font-black text-ink">{s.instructor}</div><div className="text-[11.5px] font-bold text-ink-3">FIC coach</div></div>
          <Tag tone={s.level === "Explorer" ? "orange" : "muted"}>{s.level === "All" ? "All levels" : s.level}</Tag>
        </div>
        <p className="mt-3 text-[14px] font-bold text-ink-2 leading-[1.55]">{s.blurb}</p>

        <div className="mt-4 text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">Concepts covered</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {s.concepts.map((c) => <ConceptChip key={c} label={c} definition={`${c} — covered in this session. Open the related lesson for the full explanation.`} lessonHref={path ? `/learn/path/${path.slug}` : "/learn/library"} />)}
        </div>

        {path && (
          <>
            <div className="mt-4 text-[11px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">Related lessons</div>
            <Link href={`/learn/path/${path.slug}`} className="block mt-2">
              <Card className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[12px] bg-green-tint flex items-center justify-center text-[18px]" aria-hidden>📘</span>
                <span className="flex-1"><span className="block text-[14px] font-black text-ink">{path.title}</span><span className="block text-[11.5px] font-bold text-ink-3">{path.lessons} lessons · {path.progress}% done</span></span>
              </Card>
            </Link>
          </>
        )}

        <div className="mt-6">
          {s.status === "live" && <Button full disabled>Join live — arrives with the live engine</Button>}
          {s.status === "upcoming" && <Reminder id={s.id} />}
          {s.status === "recorded" && <Button full variant="green" disabled>Resume — playback arrives with recordings</Button>}
          <ButtonLink href="/kai?context=live" variant="ghost" full className="mt-2">Ask Kai about this session</ButtonLink>
        </div>
      </div>
    </div>
  );
}
