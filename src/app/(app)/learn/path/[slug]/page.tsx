import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { ArtPlaceholder, ButtonLink, cx } from "@/components/ui";
import { getCourse } from "@/lib/live/learning";
import type { CourseLesson } from "@/lib/learn/types";

/**
 * A course, and every lesson in it.
 *
 * This page used to render `getPath()` — a summary with unit titles and counts and nothing to open.
 * The rows were plain list items, the padlock was hardcoded to "first unit open, everything else
 * shut" regardless of what the member could actually reach, and the button pointed at a fixture id
 * (`/lesson/if-7`) that has never existed. You could read the syllabus and not start it.
 *
 * It now runs on `getCourse()`, which already returned real modules, real lessons and per-lesson
 * status. Every lesson is a link, progress is the member's own, and the CTA goes to the lesson they
 * are actually up to.
 */

const BookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
    <path d="M12 5.5C10 4 7 4 4.5 4.5v15C7 19 10 19 12 20.5c2-1.5 5-1.5 7.5-1v-15C17 4 14 4 12 5.5z" />
    <path d="M12 5.5v15" />
  </svg>
);
const TickIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

function LessonRow({ l, last }: { l: CourseLesson; last: boolean }) {
  const done = l.status === "completed";
  const started = l.status === "in_progress";
  return (
    <li className={cx(!last && "border-b border-paper-2")}>
      <Link href={`/lesson/${l.id}`} className="fic-press flex items-center gap-3 py-[11px] -mx-1 px-1 rounded-[10px]">
        <span
          className={cx(
            "w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 text-[11.5px] font-black",
            done ? "bg-green-2 text-white" : started ? "bg-orange text-cream-text" : "bg-line-2 text-ink-4",
          )}
        >
          {done ? <TickIcon /> : started ? <BookIcon /> : l.index}
        </span>
        <div className="flex-1 min-w-0">
          <div className={cx("text-[13.5px] font-extrabold leading-[1.3]", done ? "text-ink-3" : "text-ink")}>{l.title}</div>
          <div className="text-[11px] font-bold text-ink-4">
            {l.minutes} min · {l.xp} XP
            {l.stepped && " · interactive"}
            {l.hasQuiz && " · quiz"}
            {started && ` · ${l.pct}%`}
          </div>
        </div>
        <span className="text-ink-4 font-black text-[15px]" aria-hidden>›</span>
      </Link>
    </li>
  );
}

export default async function PathDetailPage(props: PageProps<"/learn/path/[slug]">) {
  const { slug } = await props.params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const modules = course.modules.filter((m) => m.lessons.length);
  const next = course.nextLesson;
  // "Started" includes a lesson left part-way, not just one finished.
  const started = course.done > 0 || (next != null && next.status !== "not_started");
  const finished = course.pct === 100;
  // Short courses would otherwise read "~0 hrs".
  const length = course.minutes >= 60 ? `~${Math.round(course.minutes / 60)} hrs` : `~${course.minutes} min`;

  return (
    <div className="-mx-[18px] pb-6">
      <TopBar
        backHref="/learn/library"
        right={
          <span className="bg-orange-tint text-orange-2 rounded-[20px] px-[13px] py-[5px] text-[11px] font-black whitespace-nowrap">
            {finished ? "COMPLETED" : course.pct > 0 ? `${course.pct}% DONE` : started ? "IN PROGRESS" : "UP NEXT FOR YOU"}
          </span>
        }
      />
      <div className="px-[18px]">
        <div className="flex gap-[14px] items-center mt-[6px]">
          <ArtPlaceholder label="path art" className="w-16 h-16 rounded-[18px] shrink-0 text-[8px]" />
          <div className="min-w-0">
            <h1 className="text-[22px] font-black text-ink leading-tight text-pretty">{course.title}</h1>
            <div className="text-[12.5px] font-bold text-ink-3">
              {modules.length} units · {course.lessons} lessons · {length}
            </div>
          </div>
        </div>
        {course.blurb && <p className="mt-[10px] text-[13.5px] font-semibold text-[#4A4436] leading-[1.5]">{course.blurb}</p>}

        <div className="flex gap-[9px] mt-3">
          {[
            [`${course.done}/${course.lessons}`, "LESSONS DONE"],
            [course.xp, "XP TO EARN"],
            [`${course.pct}%`, "COMPLETE"],
          ].map(([v, l]) => (
            <div key={l} className="flex-1 bg-card border border-line rounded-[13px] p-[10px] text-center">
              <div className="text-[15px] font-black text-ink tabular-nums">{v}</div>
              <div className="text-[10px] font-extrabold text-ink-3">{l}</div>
            </div>
          ))}
        </div>

        {modules.map((m) => (
          <section key={m.id} className="mt-[18px]">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[14.5px] font-black text-ink leading-[1.25]">{m.title}</h2>
              <span className="text-[11px] font-extrabold text-ink-4 whitespace-nowrap tabular-nums">
                {m.done}/{m.lessons.length}
              </span>
            </div>
            {m.blurb && <p className="mt-[3px] text-[12px] font-semibold text-ink-3 leading-[1.45]">{m.blurb}</p>}
            <ol className="mt-2 bg-card border border-line rounded-card px-4 py-[2px]">
              {m.lessons.map((l, li) => (
                <LessonRow key={l.id} l={l} last={li === m.lessons.length - 1} />
              ))}
            </ol>
          </section>
        ))}

        {next && (
          <ButtonLink
            href={`/lesson/${next.id}`}
            variant="green"
            full
            className="mt-4 !bg-green-2 !h-auto py-[14px] !rounded-[14px] text-[14.5px] shadow-[0_3px_0_#3A6B3E]"
          >
            {finished ? `Review: ${next.title}` : started ? `Continue: ${next.title}` : `Start: ${next.title}`}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
