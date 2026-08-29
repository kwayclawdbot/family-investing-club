import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { dateTime, funnelAnalytics, funnelPartialLeads, serverNow } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, FilterLinks, HBar, Notice, PageHeader, Panel, Stat, Table, Td, Th } from "@/components/admin/ui";

const RANGES = ["7", "30", "90"];
const FUNNELS = [{ id: "free_class", label: "Free class" }, { id: "challenge", label: "Challenge" }];

/** Funnel analytics — `admin_funnel_analytics` + `admin_funnel_partial_leads` (people who stalled mid-flow). */
export default async function AdminFunnelPage(props: PageProps<"/admin/funnel">) {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const sp = await props.searchParams;
  const days = typeof sp.days === "string" && RANGES.includes(sp.days) ? Number(sp.days) : 30;
  const funnel = typeof sp.funnel === "string" ? sp.funnel : "free_class";
  const toIso = new Date().toISOString();
  const fromIso = new Date(serverNow() - days * 86_400_000).toISOString();
  const [a, partial] = await Promise.all([funnelAnalytics(fromIso, toIso, funnel), funnelPartialLeads(fromIso, toIso, funnel)]);

  const t = a?.totals;
  const pct = (n: number | undefined, d: number | undefined) => (d && n != null ? `${Math.round((n / d) * 100)}%` : "—");
  const maxStep = Math.max(1, ...(a?.steps ?? []).map((x) => x.sessions));

  return (
    <>
      <PageHeader title="Funnel" sub={`Landing-page sessions for the last ${days} days.`} action={
        <div className="flex items-center gap-2">
          <FilterLinks base="/admin/funnel" param="funnel" value={funnel} items={FUNNELS} />
          <FilterLinks base="/admin/funnel" param="days" value={String(days)} items={RANGES.map((d) => ({ id: d, label: `${d}d` }))} />
        </div>
      } />
      {!a && <div className="mb-5"><Notice tone="orange">`admin_funnel_analytics` returned nothing for this window.</Notice></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Sessions" value={t?.sessions ?? 0} />
        <Stat label="Engaged" value={t?.engaged ?? 0} sub={pct(t?.engaged, t?.sessions) + " of sessions"} />
        <Stat label="Email captured" value={t?.email_captured ?? 0} tone="orange" sub={pct(t?.email_captured, t?.sessions) + " of sessions"} />
        <Stat label="Registered" value={t?.registered ?? 0} tone="green" sub={pct(t?.registered, t?.email_captured) + " of captures"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel title="Steps">
          {(a?.steps ?? []).length === 0 ? <p className="text-[13px] font-bold text-ink-3 py-4">No step events.</p> : (a?.steps ?? []).map((x) => (
            <HBar key={x.step} label={x.step.replace(/_/g, " ")} value={x.sessions} max={maxStep} right={`${x.sessions} · ${pct(x.sessions, maxStep)}`} />
          ))}
        </Panel>
        <Panel title="Sources">
          <Table minWidth={420} className="border-0">
            <thead><tr><Th>Source</Th><Th right>Sessions</Th><Th right>Emails</Th><Th right>Registered</Th></tr></thead>
            <tbody>
              {(a?.sources ?? []).length === 0 ? <EmptyRow cols={4}>No traffic attributed.</EmptyRow> : (a?.sources ?? []).map((x) => (
                <tr key={x.source}><Td>{x.source || "direct"}</Td><Td right>{x.sessions}</Td><Td right muted>{x.email_captured}</Td><Td right>{x.registered}</Td></tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>

      <Panel title={`Stalled mid-funnel · ${(partial ?? []).length}`} >
        <Table minWidth={820} className="border-0">
          <thead><tr><Th>Email</Th><Th>Phone</Th><Th>Status</Th><Th>Source</Th><Th>Answers</Th><Th>Last touch</Th></tr></thead>
          <tbody>
            {(partial ?? []).length === 0 ? <EmptyRow cols={6}>Nobody stalled — everyone who started, finished.</EmptyRow> : (partial ?? []).slice(0, 100).map((p) => (
              <tr key={p.id}>
                <Td><span className="text-ink">{p.email}</span></Td>
                <Td muted>{p.phone ?? "—"}{p.sms_optin && <Chip tone="green" className="ml-1">sms</Chip>}</Td>
                <Td><Chip tone={p.status === "registered" ? "green" : "orange"}>{p.status}</Chip></Td>
                <Td muted>{p.utm_source || "direct"}{p.utm_campaign ? ` · ${p.utm_campaign}` : ""}</Td>
                <Td muted className="max-w-[260px]"><span className="block truncate">{Object.entries(p.answers ?? {}).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—"}</span></Td>
                <Td muted className="whitespace-nowrap">{dateTime(p.updated_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
