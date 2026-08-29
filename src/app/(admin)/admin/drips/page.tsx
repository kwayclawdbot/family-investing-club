import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { dateTime, drips } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Notice, PageHeader, Panel, Stat, StatusChip, Table, Td, Th } from "@/components/admin/ui";
import { DripsToggle } from "@/components/admin/SmallActions";

/** Welcome drip — `email_drips` queue + the `app_settings.drip_enabled` master switch. */
export default async function AdminDripsPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const d = await drips(200);
  const rows = d?.rows ?? [];
  const count = (st: string) => rows.filter((r) => r.status === st).length;

  return (
    <>
      <PageHeader title="Welcome drip" sub="The onboarding email sequence. `/api/cron/drip-welcome` sends whatever is scheduled and due while the switch is on." action={d ? <DripsToggle enabled={d.enabled} /> : undefined} />
      {!d && <div className="mb-5"><Notice tone="orange">Couldn&apos;t read `email_drips`.</Notice></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Pending" value={count("pending")} tone={count("pending") ? "orange" : undefined} />
        <Stat label="Sent" value={count("sent")} tone="green" />
        <Stat label="Failed" value={count("failed")} tone={count("failed") ? "red" : undefined} />
        <Stat label="Cancelled" value={count("cancelled") + count("skipped")} />
      </div>

      <Panel title={`Latest ${rows.length} rows`} action={<Link href="/admin/campaigns" className="text-[12px] font-extrabold text-green hover:underline">One-off campaigns →</Link>}>
        <Table minWidth={880} className="border-0">
          <thead><tr><Th>Member</Th><Th>Sequence</Th><Th right>Step</Th><Th>Variant</Th><Th>Status</Th><Th>Scheduled</Th><Th>Sent</Th></tr></thead>
          <tbody>
            {rows.length === 0 ? <EmptyRow cols={7}>Nothing queued.</EmptyRow> : rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper-2/60">
                <Td><Link href={`/admin/members/${r.user_id}`} className="text-ink hover:text-green">{r.profiles?.display_name || r.profiles?.email || r.user_id.slice(0, 8)}</Link></Td>
                <Td muted>{r.sequence ?? "welcome"}</Td>
                <Td right>{r.step}</Td>
                <Td><Chip>{r.variant}</Chip></Td>
                <Td><StatusChip status={r.status} />{r.error && <span className="block text-[11px] text-red truncate max-w-[220px]">{r.error}</span>}</Td>
                <Td muted className="whitespace-nowrap">{dateTime(r.scheduled_at)}</Td>
                <Td muted className="whitespace-nowrap">{r.sent_at ? dateTime(r.sent_at) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
