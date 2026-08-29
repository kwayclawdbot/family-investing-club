import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { catalogueCounts, crmOverview, dailyActivity, relativeTime, serverNow, shortDate } from "@/lib/live/admin-crm";
import { AdminAvatar, BarChart, Chip, EmptyRow, Notice, PageHeader, Panel, SeenDot, Stat, Table, Td, Th, TierChip } from "@/components/admin/ui";
import { InviteForm } from "@/components/admin/InviteForm";

/** Overview — `admin_crm_overview` + `admin_daily_activity` (FTA `/admin` dashboard, rebuilt). */
export default async function AdminOverviewPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const nowMs = serverNow();
  const [o, daily, cat] = await Promise.all([crmOverview(), dailyActivity(30), catalogueCounts()]);

  const days = daily ?? [];
  const label = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sum = (k: "signups" | "posts" | "lessons_completed") => days.reduce((n, d) => n + (d[k] ?? 0), 0);

  return (
    <>
      <PageHeader title="Overview" sub="Everything across FIC and the Academy, live from Supabase." action={<InviteForm compact />} />

      {!o && <div className="mb-5"><Notice tone="orange">`admin_crm_overview` returned nothing — either the RPC is unavailable or this session lost its admin claim. Nothing below is cached.</Notice></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Members" value={o?.total_members ?? "—"} sub={o ? `${o.members_fta} academy · ${o.members_fic} club` : undefined} />
        <Stat label="Families" value={o?.total_families ?? "—"} sub={o ? `${o.tier_fta} FTA · ${o.tier_fic} FIC` : undefined} />
        <Stat label="Active today" value={o?.dau ?? "—"} tone="green" sub={o ? `${o.wau} this week · ${o.mau} this month` : undefined} />
        <Stat label="Open tickets" value={cat?.openTickets ?? "—"} tone={cat && cat.openTickets > 0 ? "orange" : undefined} sub={cat ? `${cat.courses} courses · ${cat.lessons} lessons` : undefined} />
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-4 mb-4">
        <Panel title="Active members · last 30 days" action={<span className="text-[11.5px] font-bold text-ink-3">{sum("signups")} signups · {sum("posts")} posts · {sum("lessons_completed")} lessons</span>}>
          {days.length === 0 ? <p className="text-[13px] font-bold text-ink-3 py-6 text-center">No activity rows yet.</p> : <BarChart data={days.map((d) => ({ label: label(d.day), value: d.active_users }))} />}
        </Panel>
        <Panel title="Newest signups" action={<Link href="/admin/members" className="text-[12px] font-extrabold text-green hover:underline">All members →</Link>}>
          <ul className="space-y-2.5">
            {(o?.newest_signups ?? []).length === 0 && <li className="text-[12.5px] font-bold text-ink-4">Nobody new.</li>}
            {(o?.newest_signups ?? []).slice(0, 7).map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 min-w-0">
                <AdminAvatar name={m.display_name} url={m.avatar_url} />
                <Link href={`/admin/members/${m.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold text-ink hover:text-green">{m.display_name || "—"}</span>
                  <span className="block truncate text-[11.5px] font-bold text-ink-3">{m.family_name ?? "No family"} · {m.role}</span>
                </Link>
                <span className="text-[11.5px] font-bold text-ink-4 whitespace-nowrap">{relativeTime(m.joined_at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Most active families · 7 days">
          <Table minWidth={420} className="border-0">
            <thead><tr><Th>Family</Th><Th>Tier</Th><Th right>Active</Th><Th right>Events</Th></tr></thead>
            <tbody>
              {(o?.active_families ?? []).length === 0 ? <EmptyRow cols={4}>Quiet week.</EmptyRow> : (o?.active_families ?? []).slice(0, 8).map((f) => (
                <tr key={f.family_id} className="hover:bg-paper-2/60">
                  <Td><Link href={`/admin/families/${f.family_id}`} className="text-ink hover:text-green">{f.name || "Untitled family"}</Link></Td>
                  <Td><TierChip tier={f.tier} /></Td>
                  <Td right muted>{f.active_members}</Td>
                  <Td right>{f.events_7d}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
        <Panel title="Going quiet" action={<Chip tone="orange">follow up</Chip>} >
          <Table minWidth={420} className="border-0">
            <thead><tr><Th>Member</Th><Th>Family</Th><Th>Last seen</Th></tr></thead>
            <tbody>
              {(o?.at_risk ?? []).length === 0 ? <EmptyRow cols={3}>Nobody drifting — nice.</EmptyRow> : (o?.at_risk ?? []).slice(0, 8).map((m) => (
                <tr key={m.id} className="hover:bg-paper-2/60">
                  <Td><Link href={`/admin/members/${m.id}`} className="text-ink hover:text-green">{m.display_name || "—"}</Link></Td>
                  <Td muted>{m.family_name ?? "—"}</Td>
                  <Td muted><SeenDot iso={m.last_seen ?? null} nowMs={nowMs} />{m.last_seen ? shortDate(m.last_seen) : "never"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
