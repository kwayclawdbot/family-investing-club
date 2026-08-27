import Link from "next/link";
import { notFound } from "next/navigation";
import { XpPill } from "@/components/learn/XpPill";
import { PathMap } from "@/components/learn/PathMap";
import { LearnHub } from "@/components/learn/LearnHub";
import { ChevronDown } from "@/components/ui/icons";
import { KaiFab } from "@/components/shell/KaiFab";
import { getPath, getUser, getLiveSessions } from "@/lib/data-live";

export default async function LearnPage(props: PageProps<"/learn">) {
  const sp = await props.searchParams;
  const bridge = typeof sp.bridge === "string" ? sp.bridge : null;
  const back = typeof sp.return === "string" && sp.return.startsWith("/") ? sp.return : null;
  const [user, path, sessions] = await Promise.all([getUser(), getPath("investing-foundations"), getLiveSessions()]);
  const liveNow = sessions.find((s) => s.status === "live");
  if (!path?.lessonList) notFound();

  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">My Learning Path</h1>
        <XpPill xp={user.weekXp} />
      </div>

      <Link
        href="/learn/library"
        className="mt-3 inline-flex items-center gap-2 bg-card border border-line rounded-[12px] px-[14px] py-[9px]"
      >
        <span className="text-[13.5px] font-extrabold text-ink">Investing 101</span>
        <ChevronDown className="text-ink-3" />
      </Link>

      {bridge && (
        <Link href={back ?? "/learn/path/build-a-portfolio"} className="mt-3 flex items-center gap-3 rounded-[14px] border border-purple-line bg-purple-tint px-[14px] py-[11px]">
          <span className="w-[26px] h-[26px] rounded-[9px] bg-purple text-white flex items-center justify-center text-[13px]">✦</span>
          <span className="flex-1 text-[12.5px] font-bold text-ink-2">Refresher: <b className="text-purple-2">{bridge}</b> · 3 min{back ? " → then back to your vote" : ""}</span>
          <span className="text-[12px] font-black text-purple-2">{back ? "Go →" : "Open →"}</span>
        </Link>
      )}

      <LearnHub liveNow={liveNow} />

      <h2 className="mt-5 text-[15px] font-black text-ink">Your path</h2>
      <PathMap lessons={path.lessonList} nextHref="/lesson/if-7" />
      <KaiFab context="learn" />
    </div>
  );
}
