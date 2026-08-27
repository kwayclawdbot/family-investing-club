import { TopBar } from "@/components/shell/TopBar";
import { LiveList } from "@/components/live/LiveList";
import { getLiveSessions } from "@/lib/data";

export default async function LivePage() {
  const sessions = await getLiveSessions();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/learn" title="Live Classes" />
      <div className="px-[18px] pb-6">
        <h1 className="text-[21px] font-black text-ink mt-1">Learn with a coach</h1>
        <p className="text-[13px] font-bold text-ink-3 mt-1">Scheduled instruction for families, learners and classes — every session links to a lesson.</p>
        <LiveList sessions={sessions} />
      </div>
    </div>
  );
}
