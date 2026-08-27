import { LiveList } from "@/components/live/LiveList";
import { getLiveSessions, getPaths } from "@/lib/data";

/** Artboard 22 — Live & Classes. */
export default async function LivePage() {
  const [sessions, paths] = await Promise.all([getLiveSessions(), getPaths()]);
  const pathTitles = Object.fromEntries(paths.map((p) => [p.slug, p.title]));
  return (
    <div className="pt-[18px] pb-6">
      <h1 className="text-[21px] font-black text-ink">Live &amp; Classes</h1>
      <LiveList sessions={sessions} pathTitles={pathTitles} />
    </div>
  );
}
