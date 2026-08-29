import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { leadDetail, marketingLeads } from "@/lib/live/admin-crm";
import { Notice, PageHeader, Panel } from "@/components/admin/ui";
import { LeadEditor, Pipeline } from "@/components/admin/Pipeline";

/** Pipeline — kanban over `admin_marketing_leads`; `?lead=<id>` opens the detail pane. */
export default async function AdminPipelinePage(props: PageProps<"/admin/pipeline">) {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const sp = await props.searchParams;
  const selected = typeof sp.lead === "string" ? sp.lead : null;
  const [leads, detail] = await Promise.all([marketingLeads(), selected ? leadDetail(selected) : Promise.resolve(null)]);

  return (
    <>
      <PageHeader title="Pipeline" sub="Drag-free kanban: change a stage from the card. Stage moves write `admin_marketing_set_stage` and log a lead event." />
      {!leads && <div className="mb-5"><Notice tone="orange">`admin_marketing_leads` returned nothing.</Notice></div>}
      <div className="grid xl:grid-cols-[1fr_360px] gap-4 items-start">
        <Pipeline leads={leads ?? []} selected={selected} />
        {selected ? (detail ? <LeadEditor detail={detail} /> : <Panel title="Lead"><p className="text-[13px] font-bold text-ink-3">Couldn&apos;t load that lead.</p></Panel>)
          : <Panel title="Lead"><p className="text-[13px] font-bold text-ink-3 leading-[1.5]">Pick a card to see its timeline, edit tags and notes, or jump to the member profile once they convert.</p></Panel>}
      </div>
    </>
  );
}
