import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { challengeCohort, shortDate } from "@/lib/live/admin-crm";
import { BarChart, Chip, EmptyRow, Notice, PageHeader, Panel, Stat, Table, Td, Th } from "@/components/admin/ui";

/** Challenge cohort — `admin_challenge_cohort`: the paid 9-day cohort, its activation and its sequences. */
export default async function AdminChallengePage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const c = await challengeCohort();
  const members = c?.members ?? [];
  const label = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <>
      <PageHeader title="Challenge cohort" sub="Everyone who bought a challenge pass: did they sign in, did they engage, did they stay." />
      {!c && <div className="mb-5"><Notice tone="orange">`admin_challenge_cohort` returned nothing.</Notice></div>}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-5">
        <Stat label="Signed up" value={c?.total ?? 0} />
        <Stat label="Activated" value={c?.activated ?? 0} tone="green" />
        <Stat label="Engaged" value={c?.engaged ?? 0} tone="green" />
        <Stat label="Converted" value={c?.converted_paid ?? 0} tone="orange" />
        <Stat label="Pass active" value={c?.pass_active ?? 0} />
        <Stat label="Back to free" value={c?.downgraded_free ?? 0} tone={c?.downgraded_free ? "red" : undefined} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        <Panel title="Signups by day">
          {(c?.signups_by_day ?? []).length === 0 ? <p className="text-[13px] font-bold text-ink-3 py-6 text-center">No signups in the window.</p>
            : <BarChart data={(c?.signups_by_day ?? []).map((d) => ({ label: label(d.day), value: d.signups }))} color="var(--orange)" />}
        </Panel>
        <Panel title="Where they came from">
          <ul className="space-y-1.5">
            {(c?.signups_by_source ?? []).length === 0 && <li className="text-[12.5px] font-bold text-ink-4">No source attribution.</li>}
            {(c?.signups_by_source ?? []).map((x) => (
              <li key={x.source} className="flex items-center justify-between text-[12.5px] font-bold"><span className="text-ink-2">{x.source || "direct"}</span><span className="tabular-nums text-ink">{x.signups}</span></li>
            ))}
          </ul>
          {(c?.sequences ?? []).length > 0 && (
            <>
              <h3 className="mt-4 mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink-3">Email sequence</h3>
              <ul className="space-y-1.5">
                {(c?.sequences ?? []).map((q) => (
                  <li key={q.step} className="flex items-center justify-between text-[12px] font-bold"><span className="text-ink-2">{q.step}</span><span className="text-ink-4">{q.sent} sent · {q.pending} pending</span></li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <Panel title={`Cohort · ${members.length}`} >
        <Table minWidth={940} className="border-0">
          <thead><tr><Th>Member</Th><Th>Joined</Th><Th>Tier</Th><Th>Pass until</Th><Th right>XP</Th><Th right>Alerts</Th><Th right>Posts</Th><Th>Source</Th></tr></thead>
          <tbody>
            {members.length === 0 ? <EmptyRow cols={8}>Nobody in the cohort yet.</EmptyRow> : members.map((m, i) => (
              <tr key={`${m.email ?? m.user_id ?? i}`} className="hover:bg-paper-2/60">
                <Td>
                  {m.user_id ? <Link href={`/admin/members/${m.user_id}`} className="text-ink hover:text-green">{m.first_name || m.email || "—"}</Link> : <span className="text-ink">{m.first_name || m.email || "—"}</span>}
                  <span className="block text-[11.5px] text-ink-3">{m.email ?? m.phone ?? "—"}</span>
                </Td>
                <Td muted className="whitespace-nowrap">{shortDate(m.created_at)}</Td>
                <Td><Chip tone={m.tier === "fta" ? "gold" : m.tier === "fic" ? "green" : "muted"}>{m.tier ?? "free"}</Chip>{m.onboarding_complete === false && <Chip tone="orange" className="ml-1">no signin</Chip>}</Td>
                <Td muted className="whitespace-nowrap">{shortDate(m.expires_at)}</Td>
                <Td right>{m.xp}</Td>
                <Td right muted>{m.alert_rules}</Td>
                <Td right muted>{m.posts}</Td>
                <Td muted>{m.src ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
