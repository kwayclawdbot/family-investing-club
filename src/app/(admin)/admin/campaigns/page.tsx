import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { campaigns, dateTime, resendConfigured, twilioConfigured } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Notice, PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { CampaignComposer, CampaignRowActions, CampaignStatus } from "@/components/admin/CampaignsPanel";

/** Campaigns — `admin_marketing_campaigns`; sending runs through /api/admin/campaigns/send (dry run first). */
export default async function AdminCampaignsPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const rows = await campaigns();
  const list = rows ?? [];
  const resend = resendConfigured();
  const twilio = twilioConfigured();

  return (
    <>
      <PageHeader title="Campaigns" sub="One-off email or SMS to a lead segment. Always dry-run first — it prints exactly who would receive it." />
      {(!resend || !twilio) && (
        <div className="mb-4">
          <Notice tone="orange">
            {!resend && !twilio ? "Neither RESEND_API_KEY nor the Twilio credentials are set on this deployment — campaigns save and dry-run, but nothing leaves the building."
              : !resend ? "RESEND_API_KEY isn't set — email campaigns save and dry-run only. SMS is live."
              : "Twilio credentials aren't set — SMS campaigns save and dry-run only. Email is live."}
          </Notice>
        </div>
      )}
      <div className="mb-4"><CampaignComposer resend={resend} twilio={twilio} /></div>

      <Panel title={`Campaigns · ${list.length}`} >
        <Table minWidth={900} className="border-0">
          <thead><tr><Th>Campaign</Th><Th>Channel</Th><Th>Segment</Th><Th>Status</Th><Th right>Sent</Th><Th right>Failed</Th><Th>Created</Th><Th right>Send</Th></tr></thead>
          <tbody>
            {list.length === 0 ? <EmptyRow cols={8}>No campaigns yet — write one above.</EmptyRow> : list.map((c) => (
              <tr key={c.id} className="hover:bg-paper-2/60">
                <Td><span className="text-ink">{c.name}</span>{c.subject && <span className="block text-[11.5px] text-ink-3 truncate max-w-[280px]">{c.subject}</span>}</Td>
                <Td><Chip tone={c.channel === "sms" ? "purple" : "blue"}>{c.channel}</Chip></Td>
                <Td muted className="max-w-[240px]">
                  <span className="flex flex-wrap gap-1">
                    {(c.segment?.stages ?? []).map((x) => <span key={x} className="rounded-[5px] bg-paper-2 px-1.5 py-[2px] text-[10px] font-black text-ink-3">{x}</span>)}
                    {(c.segment?.tags ?? []).map((x) => <span key={x} className="rounded-[5px] bg-green-tint px-1.5 py-[2px] text-[10px] font-black text-green">#{x}</span>)}
                    {!(c.segment?.stages ?? []).length && !(c.segment?.tags ?? []).length && "everyone"}
                  </span>
                </Td>
                <Td><CampaignStatus status={c.status} /></Td>
                <Td right>{c.sends_sent}<span className="text-ink-4">/{c.sends_total}</span></Td>
                <Td right muted>{c.sends_failed}{c.sends_skipped ? ` · ${c.sends_skipped} skipped` : ""}</Td>
                <Td muted className="whitespace-nowrap">{c.sent_at ? dateTime(c.sent_at) : dateTime(c.created_at)}</Td>
                <Td right><CampaignRowActions c={c} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
