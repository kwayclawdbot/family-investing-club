import Link from "next/link";
import { notFound } from "next/navigation";
import { getIdea } from "@/lib/data";
import type { IdeaStatus } from "@/lib/types";
import { Avatar, cx } from "@/components/ui";
import { ChevronLeft } from "@/components/ui/icons";
import { SaveToggle, FollowButton, IdeaBottomBar } from "@/components/club/IdeaActions";

/** Plan §8.3 lifecycle (canonical — the artboard omitted DISCUSSING). */
const LIFECYCLE: IdeaStatus[] = ["DRAFT", "RESEARCHING", "DISCUSSING", "WATCHING", "ACTIVE"];

export default async function IdeaPage(props: PageProps<"/club/idea/[id]">) {
  const { id } = await props.params;
  const idea = await getIdea(id);
  if (!idea) notFound();
  const cur = LIFECYCLE.indexOf(idea.status);

  return (
    // escape the tab-shell padding so the bottom bar can sit flush
    <div className="-mx-[18px] flex flex-col min-h-full">
      <div className="flex-1 px-[18px] pt-[14px] pb-4">
        <div className="flex items-center justify-between">
          <Link href="/club" aria-label="Back to Club" className="text-ink-2 -ml-1">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="bg-green-tint text-green rounded-[20px] px-[13px] py-[5px] text-[11px] font-black">● {idea.status}</span>
            <SaveToggle />
          </div>
        </div>

        <h1 className="mt-[14px] text-[22px] font-black text-ink leading-[1.25]">{idea.title}</h1>
        <div className="flex items-center gap-[9px] mt-[10px]">
          <Avatar name={idea.author} color="bg-coral" size={30} />
          <div className="flex-1 text-[12.5px] font-extrabold text-ink-2">
            <Link href="/club/members/sarah-j" className="text-ink hover:underline">{idea.author}</Link> · Idea owner · {idea.ago}
          </div>
          <FollowButton />
        </div>

        {/* lifecycle stepper */}
        <ol className="flex items-center mt-[14px] bg-card border border-line rounded-[12px] px-3 py-[9px]" aria-label="Idea lifecycle">
          {LIFECYCLE.map((s, i) => (
            <li key={s} className="contents">
              <span
                aria-current={i === cur ? "step" : undefined}
                className={cx(
                  "text-[9px] font-black whitespace-nowrap",
                  i === cur ? "text-green bg-green-tint rounded-[8px] px-[6px] py-[3px]" : i < cur ? "text-green" : "text-[#B9AE94]"
                )}
              >
                {s}
              </span>
              {i < LIFECYCLE.length - 1 && (
                <span className={cx("flex-1 h-[2px] mx-[4px] min-w-[6px]", i < cur ? "bg-green-2" : "bg-line")} />
              )}
            </li>
          ))}
        </ol>

        <section className="mt-3 bg-card border border-line rounded-card px-4 py-[14px]">
          <h2 className="text-[11.5px] font-black text-orange tracking-[0.5px]">THE OPPORTUNITY</h2>
          <p className="mt-[6px] text-[13px] font-semibold text-[#4A4436] leading-[1.5]">{idea.opportunity}</p>
        </section>

        <section className="mt-[10px] bg-card border border-line rounded-card px-4 pt-[14px] pb-1">
          <h2 className="text-[11.5px] font-black text-orange tracking-[0.5px]">COMPANIES WE&apos;RE RESEARCHING</h2>
          {idea.companies.map((c, i) => (
            <Link
              key={c.symbol}
              href={`/discover/${c.symbol}`}
              className={cx("flex items-center gap-[10px] py-[10px]", i < idea.companies.length - 1 && "border-b border-paper-2")}
            >
              <span className="w-8 h-8 rounded-[10px] bg-green-tint text-green flex items-center justify-center text-[10px] font-black">{c.symbol}</span>
              <div className="flex-1 text-[13px] font-extrabold text-ink">{c.name}</div>
              <span className={cx("text-[12px] font-black", c.changePct >= 0 ? "text-[#3A8C4A]" : "text-red")}>
                {c.changePct >= 0 ? "+" : "−"}{Math.abs(c.changePct).toFixed(1)}%
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-[10px] bg-card border border-line rounded-card px-4 py-[14px]">
          <h2 className="text-[11.5px] font-black text-red tracking-[0.5px]">KEY RISKS</h2>
          <p className="mt-[6px] text-[13px] font-semibold text-[#4A4436] leading-[1.55]">{idea.risks}</p>
        </section>

        <div className="flex gap-[7px] mt-[10px] flex-wrap">
          {idea.concepts.map((c) => (
            <Link key={c} href="/learn/library" className="bg-purple-tint text-purple-2 rounded-[9px] px-[11px] py-[5px] text-[11px] font-extrabold">
              CONCEPT: {c}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[10.5px] font-semibold text-ink-4 leading-[1.4]">
          Community ideas are for learning and discussion — not personalized financial advice.
        </p>
      </div>
      <IdeaBottomBar comments={idea.comments} ideaId={idea.id} />
    </div>
  );
}
