import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { marketingLeads, PIPELINE_STAGES, relativeTime, shortDate } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Notice, PageHeader, Panel, StageChip, Stat, Table, Td, Th } from "@/components/admin/ui";
import { LeadsPanel } from "@/components/admin/LeadsPanel";

const MAX = 200;

/** Leads — `admin_marketing_leads` list + add / CSV import / conversion sync. */
export default async function AdminLeadsPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const leads = await marketingLeads();
  const list = leads ?? [];
  const byStage = (st: string) => list.filter((l) => l.stage === st).length;

  return (
    <>
      <PageHeader title="Leads" sub={`${list.length} leads in marketing_leads. New ones arrive from the funnel, Meta lead ads and CSV imports.`} action={<Link href="/admin/pipeline" className="h-[40px] px-[18px] rounded-[12px] inline-flex items-center text-[13.5px] font-black bg-card border border-line text-ink">Open pipeline →</Link>} />
      {!leads && <div className="mb-5"><Notice tone="orange">`admin_marketing_leads` returned nothing.</Notice></div>}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mb-5">
        {PIPELINE_STAGES.map((st) => <Stat key={st} label={st} value={byStage(st)} tone={st === "converted" ? "green" : undefined} />)}
      </div>

      <div className="mb-4"><LeadsPanel /></div>

      <Panel title={`Newest leads · ${Math.min(list.length, MAX)} of ${list.length}`} >
        <Table minWidth={900} className="border-0">
          <thead><tr><Th>Lead</Th><Th>Stage</Th><Th>Source</Th><Th>Tags</Th><Th right>Events</Th><Th>Last activity</Th><Th>Created</Th></tr></thead>
          <tbody>
            {list.length === 0 ? <EmptyRow cols={7}>No leads yet.</EmptyRow> : list.slice(0, MAX).map((l) => (
              <tr key={l.id} className="hover:bg-paper-2/60">
                <Td>
                  <Link href={`/admin/pipeline?lead=${l.id}`} className="min-w-0 block">
                    <span className="block truncate text-ink">{[l.first_name, l.last_name].filter(Boolean).join(" ") || l.email}</span>
                    <span className="block truncate text-[11.5px] text-ink-3">{l.email}{l.phone ? ` · ${l.phone}` : ""}</span>
                  </Link>
                </Td>
                <Td><StageChip stage={l.stage} />{l.is_cold && <Chip className="ml-1">cold</Chip>}</Td>
                <Td muted>{l.source}</Td>
                <Td muted className="max-w-[220px]"><span className="flex flex-wrap gap-1">{l.tags.slice(0, 3).map((t) => <span key={t} className="rounded-[5px] bg-paper-2 px-1.5 py-[2px] text-[10px] font-black text-ink-3">{t}</span>)}</span></Td>
                <Td right>{l.event_count}</Td>
                <Td muted>{relativeTime(l.last_activity_at)}{l.last_event_type ? ` · ${l.last_event_type}` : ""}</Td>
                <Td muted>{shortDate(l.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
