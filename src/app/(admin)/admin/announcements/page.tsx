import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { announcementHistory, audienceCount, broadcastHistory, dateTime, type AudienceCount } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { AnnouncementsPanel } from "@/components/admin/AnnouncementsPanel";

const AUDIENCES = ["all", "fic", "fta", "free"];

/** Announcements + push broadcast — `admin_post_announcement` / `admin_push_broadcast`, with live audience sizes. */
export default async function AdminAnnouncementsPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const [counts, announcements, broadcasts] = await Promise.all([
    Promise.all(AUDIENCES.map((a) => audienceCount(a))),
    announcementHistory(30),
    broadcastHistory(30),
  ]);
  const byAudience: Record<string, AudienceCount | null> = Object.fromEntries(AUDIENCES.map((a, i) => [a, counts[i]]));

  return (
    <>
      <PageHeader title="Announcements" sub="Post to the community feed with an in-app notification, or send a push-only blast." />
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4 items-start">
        <AnnouncementsPanel counts={byAudience} />
        <div className="space-y-4">
          <Panel title={`Announcements · ${(announcements ?? []).length}`} >
            <Table minWidth={520} className="border-0">
              <thead><tr><Th>Title</Th><Th>Audience</Th><Th right>Delivered</Th><Th right>Read</Th><Th>When</Th></tr></thead>
              <tbody>
                {(announcements ?? []).length === 0 ? <EmptyRow cols={5}>Nothing posted yet.</EmptyRow> : (announcements ?? []).map((a) => (
                  <tr key={a.id}>
                    <Td><span className="text-ink">{a.title ?? "—"}</span>{a.body && <span className="block text-[11.5px] text-ink-3 truncate max-w-[260px]">{a.body}</span>}</Td>
                    <Td><Chip tone={a.audience === "all" ? "muted" : "green"}>{a.audience ?? "all"}</Chip></Td>
                    <Td right>{a.delivered}</Td>
                    <Td right muted>{a.read_count}</Td>
                    <Td muted className="whitespace-nowrap">{dateTime(a.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
          <Panel title={`Push broadcasts · ${(broadcasts ?? []).length}`} >
            <Table minWidth={520} className="border-0">
              <thead><tr><Th>Title</Th><Th>Audience</Th><Th right>Recipients</Th><Th right>Pushed</Th><Th>When</Th></tr></thead>
              <tbody>
                {(broadcasts ?? []).length === 0 ? <EmptyRow cols={5}>No broadcasts yet.</EmptyRow> : (broadcasts ?? []).map((b) => (
                  <tr key={b.id}>
                    <Td><span className="text-ink">{b.title}</span>{b.link && <span className="block text-[11.5px] text-ink-3 truncate max-w-[240px]">{b.link}</span>}</Td>
                    <Td><Chip tone={b.audience === "all" ? "muted" : "green"}>{b.audience}</Chip></Td>
                    <Td right>{b.recipients}</Td>
                    <Td right muted>{b.dispatched}</Td>
                    <Td muted className="whitespace-nowrap">{dateTime(b.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </div>
      </div>
    </>
  );
}
