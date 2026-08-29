import { renderMerge, requireAdmin, resendConfigured, sendEmail, sendSms, twilioConfigured } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

/**
 * POST /api/admin/campaigns/send — port of FTA /api/marketing/campaigns/send.
 *  A) { campaignId, dryRun }            batch over the segment; logs a `marketing_sends` row per lead.
 *  B) { test: { channel, to, subject?, body } } one real send, no DB writes.
 * Without RESEND_API_KEY / Twilio creds the route answers `{ configured:false }` and (for A) still
 * records the dry-run. SMS batches are always dry-run — the Twilio number is shared with Kai's inbound webhook.
 */
type LeadRow = { id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null };

function emailHtml(text: string): string {
  const paragraphs = text.split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#FAF3E5;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2E2A21"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #EBDFC7;padding:32px">${paragraphs}<hr style="border:none;border-top:1px solid #EBDFC7;margin:24px 0"><p style="font-size:12px;color:#8F8672;line-height:1.5;margin:0">Family Investing Club · You're receiving this because you joined one of our lists. Reply UNSUBSCRIBE to opt out.</p></div></body></html>`;
}

export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ campaignId?: string; dryRun?: boolean; test?: { channel?: string; to?: string; subject?: string; body?: string } }>(req);

  if (b.test) {
    const t = b.test;
    if (!t.to || (t.channel !== "email" && t.channel !== "sms")) return bad("test needs channel + to");
    const configured = t.channel === "sms" ? twilioConfigured() : resendConfigured();
    if (!configured) return ok({ configured: false, message: t.channel === "sms" ? "Twilio isn't configured on this deployment (TWILIO_ACCOUNT_SID / AUTH_TOKEN / PHONE_NUMBER)." : "Resend isn't configured on this deployment (RESEND_API_KEY)." });
    const res = t.channel === "sms" ? await sendSms({ to: t.to, body: t.body || "Test" }) : await sendEmail({ to: t.to, subject: t.subject || "Test", html: emailHtml(t.body || "Test") });
    return ok({ configured: true, sent: res.ok ? 1 : 0, failed: res.ok ? 0 : 1, error: res.error });
  }

  if (!b.campaignId) return bad("campaignId required");
  const db = r.admin;
  if (!db) return bad("SUPABASE_SERVICE_ROLE_KEY not configured", 503);
  const { data: c, error: cErr } = await db.from("marketing_campaigns").select("id, channel, subject, body, segment, status").eq("id", b.campaignId).single();
  if (cErr || !c) return bad("Campaign not found", 404);
  const channel = c.channel as "email" | "sms";
  const configured = channel === "sms" ? twilioConfigured() : resendConfigured();
  const dryRun = channel === "sms" || b.dryRun !== false || !configured;

  const seg = (c.segment ?? {}) as { stages?: string[]; tags?: string[] };
  let q = db.from("marketing_leads").select("id, email, first_name, last_name, phone").neq("stage", "unsubscribed");
  if (seg.stages?.length) q = q.in("stage", seg.stages);
  if (seg.tags?.length) q = q.overlaps("tags", seg.tags);
  const { data: leads, error: lErr } = await q;
  if (lErr) return dbError(lErr);

  if (!dryRun) await db.from("marketing_campaigns").update({ status: "sending" }).eq("id", c.id);
  let sent = 0, failed = 0, skipped = 0;
  for (const lead of (leads ?? []) as LeadRow[]) {
    const target = channel === "sms" ? lead.phone : lead.email;
    if (!target) { await db.from("marketing_sends").insert({ campaign_id: c.id, lead_id: lead.id, status: "skipped", error: channel === "sms" ? "no phone" : "no email" }); skipped++; continue; }
    if (dryRun) { await db.from("marketing_sends").insert({ campaign_id: c.id, lead_id: lead.id, status: "skipped", error: "dry-run" }); skipped++; continue; }
    const res = channel === "email"
      ? await sendEmail({ to: lead.email, subject: renderMerge(c.subject ?? "", lead), html: emailHtml(renderMerge(c.body, lead)) })
      : await sendSms({ to: lead.phone!, body: `${renderMerge(c.body, lead)}\n\nReply STOP to opt out.` });
    await db.from("marketing_sends").insert({ campaign_id: c.id, lead_id: lead.id, status: res.ok ? "sent" : "failed", error: res.error ?? null, sent_at: res.ok ? new Date().toISOString() : null });
    if (res.ok) { sent++; await db.from("marketing_lead_events").insert({ lead_id: lead.id, type: "emailed", meta: { campaign_id: c.id } }); } else failed++;
  }
  if (!dryRun) await db.from("marketing_campaigns").update({ status: failed && !sent ? "failed" : "sent", sent_at: new Date().toISOString(), stats: { sent, failed, skipped } }).eq("id", c.id);
  return ok({ configured, dry_run: dryRun, sent, failed, skipped, message: !configured ? (channel === "sms" ? "Twilio isn't configured — recorded as a dry run." : "Resend isn't configured (RESEND_API_KEY) — recorded as a dry run.") : channel === "sms" ? "SMS batches are always dry-run on the shared Twilio number." : undefined });
}
