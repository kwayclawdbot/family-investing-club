import { XpPill } from "@/components/learn/XpPill";
import { Library } from "@/components/learn/Library";
import { getPaths, getUser } from "@/lib/data";

export default async function LibraryPage() {
  const [user, paths] = await Promise.all([getUser(), getPaths()]);
  return (
    <div className="pt-[18px] pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[21px] font-black text-ink">Course Library</h1>
        <XpPill xp={user.weekXp} />
      </div>
      <Library paths={paths} />
    </div>
  );
}
