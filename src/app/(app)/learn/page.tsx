import Link from "next/link";
import { notFound } from "next/navigation";
import { XpPill } from "@/components/learn/XpPill";
import { PathMap } from "@/components/learn/PathMap";
import { ChevronDown } from "@/components/ui/icons";
import { KaiFab } from "@/components/shell/KaiFab";
import { getPath, getUser } from "@/lib/data";

export default async function LearnPage() {
  const [user, path] = await Promise.all([getUser(), getPath("investing-foundations")]);
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

      <PathMap lessons={path.lessonList} nextHref="/lesson/if-7" />
      <KaiFab context="learn" />
    </div>
  );
}
