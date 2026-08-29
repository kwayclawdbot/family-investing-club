import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { dateTime, helpTicketDetail, helpTickets, relativeTime, TICKET_CATEGORIES } from "@/lib/live/admin-crm";
import { AdminAvatar, Chip, EmptyRow, FilterLinks, Notice, PageHeader, Panel, StatusChip, Table, Td, Th} from "@/components/admin/ui";
import { cx } from "@/components/ui";
import { TicketActions } from "@/components/admin/SmallActions";

const STATUSES = ["all", "open", "pending", "resolved", "closed"];

/** Help desk — `admin_help_tickets` / `admin_help_ticket_detail`; replies go out service-role and notify the member. */
export default async function AdminSupportPage(props: PageProps<"/admin/support">) {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && STATUSES.includes(sp.status) ? sp.status : "all";
  const category = typeof sp.category === "string" ? sp.category : "all";
  const openId = typeof sp.ticket === "string" ? sp.ticket : null;
  const [rows, detail] = await Promise.all([helpTickets(status, category), openId ? helpTicketDetail(openId) : Promise.resolve(null)]);
  const list = rows ?? [];
  const waiting = list.filter((t) => t.awaiting_team).length;

  return (
    <>
      <PageHeader title="Support" sub={`${list.length} ticket${list.length === 1 ? "" : "s"}${waiting ? ` · ${waiting} waiting on us` : ""}`} />
      {!rows && <div className="mb-4"><Notice tone="orange">`admin_help_tickets` returned nothing.</Notice></div>}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <FilterLinks base="/admin/support" param="status" value={status} items={STATUSES.map((id) => ({ id, label: id }))} />
        <FilterLinks base="/admin/support" param="category" value={category} items={[{ id: "all", label: "All topics" }, ...TICKET_CATEGORIES.map((id) => ({ id, label: id }))]} />
      </div>

      <div className="grid xl:grid-cols-[1fr_400px] gap-4 items-start">
        <Table minWidth={720}>
          <thead><tr><Th>Ticket</Th><Th>Member</Th><Th>Status</Th><Th right>Msgs</Th><Th>Last</Th></tr></thead>
          <tbody>
            {list.length === 0 ? <EmptyRow cols={5}>No tickets in this view.</EmptyRow> : list.map((t) => (
              <tr key={t.id} className={openId === t.id ? "bg-green-tint/60" : "hover:bg-paper-2/60"}>
                <Td>
                  <Link href={`/admin/support?status=${status}&category=${category}&ticket=${t.id}`} className="block min-w-0">
                    <span className="block truncate text-ink">{t.subject}</span>
                    <span className="block text-[11.5px] text-ink-3">{t.category}{t.priority && t.priority !== "normal" ? ` · ${t.priority}` : ""}</span>
                  </Link>
                </Td>
                <Td>
                  <Link href={`/admin/members/${t.user_id}`} className="flex items-center gap-2 min-w-0">
                    <AdminAvatar name={t.display_name} url={t.avatar_url} size={24} />
                    <span className="min-w-0"><span className="block truncate text-[12.5px] text-ink">{t.display_name || t.email || "—"}</span><span className="block truncate text-[11px] text-ink-3">{t.family_name ?? "—"}</span></span>
                  </Link>
                </Td>
                <Td><StatusChip status={t.status} />{t.awaiting_team && <Chip tone="orange" className="ml-1">reply</Chip>}</Td>
                <Td right muted>{t.message_count}</Td>
                <Td muted className="whitespace-nowrap">{relativeTime(t.last_message_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>

        {openId && detail?.ticket ? (
          <Panel title={detail.ticket.subject} action={<Link href={`/admin/support?status=${status}&category=${category}`} className="text-[12px] font-extrabold text-ink-3 hover:text-ink">Close</Link>}>
            <div className="flex items-center gap-2 flex-wrap mb-3 text-[12px] font-bold text-ink-3">
              <StatusChip status={detail.ticket.status} /><Chip>{detail.ticket.category}</Chip>
              <Link href={`/admin/members/${detail.ticket.user_id}`} className="text-green font-extrabold hover:underline">{detail.ticket.display_name || detail.ticket.email || "member"} →</Link>
              <span className="ml-auto">Opened {dateTime(detail.ticket.created_at)}</span>
            </div>
            <ul className="space-y-2 max-h-[46vh] overflow-y-auto pr-1 mb-3">
              {detail.messages.length === 0 && <li className="text-[12.5px] font-bold text-ink-4">No messages.</li>}
              {detail.messages.map((m) => (
                <li key={m.id} className={cx("rounded-[12px] px-3 py-2.5", m.sender === "user" ? "bg-paper-2" : m.sender === "ai" ? "bg-purple-tint" : "bg-green-tint")}>
                  <div className="text-[10.5px] font-black uppercase tracking-[0.1em] text-ink-3 mb-1">{m.sender === "user" ? "Member" : m.sender === "ai" ? "Kai" : "Team"} · {dateTime(m.created_at)}</div>
                  <p className="text-[13px] font-bold text-ink whitespace-pre-wrap leading-[1.5]">{m.body}</p>
                </li>
              ))}
            </ul>
            <TicketActions ticketId={detail.ticket.id} status={detail.ticket.status} />
          </Panel>
        ) : (
          <Panel title="Ticket"><p className="text-[13px] font-bold text-ink-3 leading-[1.5]">Pick a ticket to read the thread and reply as the team. Replies insert a `help_messages` row, which notifies the member through the existing trigger.</p></Panel>
        )}
      </div>
    </>
  );
}
