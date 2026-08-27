import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { ArtPlaceholder, ButtonLink } from "@/components/ui";
import { LockIcon } from "@/components/ui/icons";
import { getPath } from "@/lib/data-live";

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
    <path d="M12 5.5C10 4 7 4 4.5 4.5v15C7 19 10 19 12 20.5c2-1.5 5-1.5 7.5-1v-15C17 4 14 4 12 5.5z" />
    <path d="M12 5.5v15" />
  </svg>
);

export default async function PathDetailPage(props: PageProps<"/learn/path/[slug]">) {
  const { slug } = await props.params;
  const path = await getPath(slug);
  if (!path) notFound();
  const units = path.units.length
    ? path.units
    : [{ id: "u1", title: "Getting Started", lessons: path.lessons, blurb: path.blurb.toLowerCase(), kind: "unit" as const }];
  const unitCount = units.length; // artboard counts the checkpoint as a unit ("5 units · 24 lessons")

  return (
    <div className="-mx-[18px] pb-6">
      <TopBar
        backHref="/learn/library"
        right={
          <span className="bg-orange-tint text-orange-2 rounded-[20px] px-[13px] py-[5px] text-[11px] font-black whitespace-nowrap">
            {path.status === "done" ? "COMPLETED" : "UP NEXT FOR YOU"}
          </span>
        }
      />
      <div className="px-[18px]">
        <div className="flex gap-[14px] items-center mt-[6px]">
          <ArtPlaceholder label="path art" className="w-16 h-16 rounded-[18px] shrink-0 text-[8px]" />
          <div>
            <h1 className="text-[22px] font-black text-ink leading-tight">{path.title}</h1>
            <div className="text-[12.5px] font-bold text-ink-3">
              {unitCount} units · {path.lessons} lessons · {path.checkpoints} checkpoints · ~{path.hours} hrs
            </div>
          </div>
        </div>
        <p className="mt-[10px] text-[13.5px] font-semibold text-[#4A4436] leading-[1.5]">{path.blurb}</p>

        <div className="flex gap-[9px] mt-3">
          {[
            [path.xp, "XP TO EARN"],
            [path.concepts, "CONCEPTS"],
            [path.badges, "BADGES"],
          ].map(([v, l]) => (
            <div key={l} className="flex-1 bg-card border border-line rounded-[13px] p-[10px] text-center">
              <div className="text-[15px] font-black text-ink">{v}</div>
              <div className="text-[10px] font-extrabold text-ink-3">{l}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-[14px] text-[15px] font-black text-ink">Units</h2>
        <ol className="mt-2 bg-card border border-line rounded-card px-4 py-[2px]">
          {units.map((u, i) => {
            const isCheckpoint = u.kind === "checkpoint";
            const first = i === 0;
            return (
              <li
                key={u.id}
                className={`flex items-center gap-3 py-3 ${i < units.length - 1 ? "border-b border-paper-2" : ""} ${
                  !first && !isCheckpoint ? "opacity-[0.65]" : ""
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isCheckpoint ? "bg-gold text-[15px]" : first ? "bg-green" : "bg-line-3 text-ink-5"
                  }`}
                >
                  {isCheckpoint ? "⭐" : first ? <BookIcon /> : <LockIcon size={14} strokeWidth={2.4} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-extrabold text-ink">{u.title}</div>
                  <div className="text-[11.5px] font-bold text-ink-3">
                    {isCheckpoint ? u.blurb : `${u.lessons} lessons · ${u.blurb}`}
                  </div>
                </div>
                <span className="text-ink-4 font-black">›</span>
              </li>
            );
          })}
        </ol>

        <ButtonLink
          href="/lesson/if-7"
          variant="green"
          full
          className="mt-3 !bg-green-2 !h-auto py-[14px] !rounded-[14px] text-[14.5px] shadow-[0_3px_0_#3A6B3E]"
        >
          {path.status === "done" ? "Review Unit 1" : "Start Unit 1"}
        </ButtonLink>
      </div>
    </div>
  );
}
