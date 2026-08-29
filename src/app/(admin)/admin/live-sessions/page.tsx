import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { liveSessions } from "@/lib/live/admin-crm";
import { Notice, PageHeader, Stat } from "@/components/admin/ui";
import { LiveSessionsEditor } from "@/components/admin/LiveSessionsEditor";

/** Live sessions — `live_sessions` + RSVP counts; members read the same rows on /live. */
export default async function AdminLiveSessionsPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const rows = await liveSessions();
  const list = rows ?? [];
  const upcoming = list.filter((x) => x.status === "scheduled").length;

  return (
    <>
      <PageHeader title="Live sessions" sub="Family classes, guest speakers and the free public class. Members RSVP from /live." />
      {!rows && <div className="mb-5"><Notice tone="orange">Couldn&apos;t read `live_sessions`.</Notice></div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Sessions" value={list.length} />
        <Stat label="Scheduled" value={upcoming} tone="green" />
        <Stat label="RSVPs" value={list.reduce((n, x) => n + x.rsvps, 0)} tone="purple" />
        <Stat label="Recordings" value={list.filter((x) => x.recording_url || x.recording_path).length} />
      </div>
      <LiveSessionsEditor sessions={list} />
    </>
  );
}
