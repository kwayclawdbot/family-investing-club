import Link from "next/link";
import type { Lesson } from "@/lib/types";
import { LockIcon } from "@/components/ui/icons";

const PlayIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M8 5l11 7-11 7z" />
  </svg>
);

function Node({ lesson, nextHref }: { lesson: Lesson; nextHref: string }) {
  const circle = "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-[3px] border-paper box-border";
  switch (lesson.status) {
    case "done":
      return (
        <div className="flex items-center gap-[14px]">
          <span className={`${circle} bg-green-2 text-white font-black text-[15px]`}>✓</span>
          <div className="flex-1 bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center justify-between">
            <div>
              {lesson.subtitle ? (
                <>
                  <div className="text-[14px] font-extrabold text-ink">{lesson.subtitle}</div>
                  <div className="text-[11.5px] font-bold text-ink-3">{lesson.title}</div>
                </>
              ) : (
                <div className="text-[14px] font-extrabold text-ink">{lesson.title}</div>
              )}
            </div>
            <span className="text-green-2 font-black">✓</span>
          </div>
        </div>
      );
    case "checkpoint":
      return (
        <div className="flex items-center gap-[14px]">
          <span className={`${circle} bg-gold text-[16px]`}>⭐</span>
          <div className="flex-1 bg-[#FFFDF4] border border-[#F0E0AE] rounded-[14px] px-[14px] py-[11px]">
            <div className="text-[14px] font-extrabold text-ink">{lesson.title}</div>
            {lesson.subtitle && <div className="text-[11.5px] font-bold text-[#BC9227]">{lesson.subtitle}</div>}
          </div>
        </div>
      );
    case "next":
      return (
        <Link href={nextHref} className="flex items-center gap-[14px]">
          <span className={`${circle} bg-green`}>
            <PlayIcon />
          </span>
          <div className="flex-1 bg-green-tint border-2 border-green-2 rounded-[14px] px-[14px] py-3">
            <div className="text-[15px] font-black text-ink">{lesson.title}</div>
            {lesson.subtitle && <div className="text-[11.5px] font-bold text-green">{lesson.subtitle}</div>}
          </div>
        </Link>
      );
    case "challenge":
      return (
        <div className="flex items-center gap-[14px]">
          <span className={`${circle} bg-line-3 text-[14px]`}>🏆</span>
          <div className="flex-1 bg-card border border-dashed border-[#D9CDB2] rounded-[14px] px-[14px] py-[11px] opacity-70">
            <div className="text-[14px] font-extrabold text-ink-2">{lesson.title}</div>
            {lesson.subtitle && <div className="text-[11.5px] font-bold text-ink-4">{lesson.subtitle}</div>}
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-[14px]">
          <span className={`${circle} bg-line-3 text-ink-5`}>
            <LockIcon size={13} strokeWidth={2.4} />
          </span>
          <div className="flex-1 bg-card border border-line rounded-[14px] px-[14px] py-[11px] opacity-70">
            <div className="text-[14px] font-extrabold text-ink-2">{lesson.title}</div>
            {lesson.subtitle && <div className="text-[11.5px] font-bold text-ink-4">{lesson.subtitle}</div>}
          </div>
        </div>
      );
  }
}

/** Vertical progression map: nodes joined by a spine (artboard 11). */
export function PathMap({ lessons, nextHref }: { lessons: Lesson[]; nextHref: string }) {
  return (
    <div className="mt-4 relative">
      <div className="absolute left-[17px] top-[10px] bottom-[10px] w-[3px] bg-line rounded-[2px]" aria-hidden />
      <ol className="flex flex-col gap-[10px] relative">
        {lessons.map((l) => (
          <li key={l.id}>
            <Node lesson={l} nextHref={nextHref} />
          </li>
        ))}
      </ol>
    </div>
  );
}
