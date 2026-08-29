import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { familyDetail, relativeTime, serverNow, shortDate } from "@/lib/live/admin-crm";
import { AdminAvatar, Chip, EmptyRow, Notice, PageHeader, Panel, RoleChip, SeenDot, Stat, StatusChip, Table, Td, Th, TierChip } from "@/components/admin/ui";
import { FamilyTierControl } from "@/components/admin/MemberPanel";
import { InviteForm } from "@/components/admin/InviteForm";

/** Family detail — `admin_family_detail`; tier changes go through `admin_set_family_tier`. */
export default async function AdminFamilyPage(props: PageProps<"/admin/families/[familyId]">) {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const { familyId } = await props.params;
  const nowMs = serverNow();
  const d = await familyDetail(familyId);
  const f = d?.family ?? null;

  if (!f) {
    return (
      <>
        <PageHeader title="Family" crumbs={[{ label: "Families", href: "/admin/families" }, { label: "Not found" }]} />
        <Notice tone="orange">`admin_family_detail` found no family with that id.</Notice>
      </>
    );
  }

  const c = d?.combined;
  return (
    <>
      <PageHeader
        title={f.name || "Untitled family"}
        sub={`${f.plan_tier ?? "no plan"} · created ${shortDate(f.created_at)}${f.expires_at ? ` · renews ${shortDate(f.expires_at)}` : ""}`}
        crumbs={[{ label: "Families", href: "/admin/families" }, { label: f.name || "Family" }]}
        action={<div className="flex items-center gap-1.5"><TierChip tier={f.tier} />{f.has_stripe ? <Chip tone="green">stripe</Chip> : <Chip>manual billing</Chip>}</div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 mb-4">
        <Stat label="XP" value={c?.xp_total ?? 0} tone="green" />
        <Stat label="Lessons" value={c?.lessons ?? 0} />
        <Stat label="Quizzes" value={c?.quizzes ?? 0} />
        <Stat label="Posts" value={c?.posts ?? 0} />
        <Stat label="Missions" value={c?.missions ?? 0} />
        <Stat label="Watchlist" value={c?.watchlist_size ?? 0} tone="purple" />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Household">
            <Table minWidth={560} className="border-0">
              <thead><tr><Th>Member</Th><Th>Role</Th><Th>Band</Th><Th right>XP</Th><Th>Last seen</Th></tr></thead>
              <tbody>
                {(d?.members ?? []).length === 0 ? <EmptyRow cols={5}>Nobody in this family yet.</EmptyRow> : (d?.members ?? []).map((m) => (
                  <tr key={m.id} className="hover:bg-paper-2/60">
                    <Td>
                      <Link href={`/admin/members/${m.id}`} className="flex items-center gap-2.5 min-w-0">
                        <AdminAvatar name={m.display_name} url={m.avatar_url} />
                        <span className="min-w-0"><span className="block truncate text-ink">{m.display_name || "—"}</span><span className="block truncate text-[11.5px] text-ink-3">{m.email ?? "—"}</span></span>
                      </Link>
                    </Td>
                    <Td><RoleChip role={m.role} /></Td>
                    <Td muted>{m.age_group ?? "—"}</Td>
                    <Td right>{m.xp_total}</Td>
                    <Td muted><SeenDot iso={m.last_seen} nowMs={nowMs} />{relativeTime(m.last_seen)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Enrollments">
              <ul className="space-y-2">
                {(d?.enrollments ?? []).length === 0 && <li className="text-[12.5px] font-bold text-ink-4">No enrollment rows.</li>}
                {(d?.enrollments ?? []).map((e, i) => (
                  <li key={`${e.program}-${i}`} className="flex items-center gap-2 text-[12.5px] font-bold text-ink-2">
                    <Chip tone={e.program === "fta" ? "gold" : "green"}>{e.program}</Chip>
                    <StatusChip status={e.status} />
                    <span className="text-ink-4">{e.cohort ?? "no cohort"} · {shortDate(e.started_at)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Orientation">
              <ul className="space-y-1.5">
                {(d?.orientation ?? []).length === 0 && <li className="text-[12.5px] font-bold text-ink-4">Not started.</li>}
                {(d?.orientation ?? []).map((o) => (
                  <li key={o.step_key} className="flex items-center justify-between text-[12.5px] font-bold">
                    <span className="text-ink-2">{o.step_key.replace(/_/g, " ")}</span>
                    <span className={o.completed_at ? "text-green font-extrabold" : "text-ink-4"}>{o.completed_at ? shortDate(o.completed_at) : "todo"}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Family watchlist">
            <Table minWidth={480} className="border-0">
              <thead><tr><Th>Ticker</Th><Th>Company</Th><Th>Status</Th><Th>Champion</Th></tr></thead>
              <tbody>
                {(d?.watchlist ?? []).length === 0 ? <EmptyRow cols={4}>Nothing on the watchlist.</EmptyRow> : (d?.watchlist ?? []).map((w) => (
                  <tr key={w.ticker}><Td><span className="font-black text-ink">{w.ticker}</span></Td><Td muted>{w.company_name ?? "—"}</Td><Td><StatusChip status={w.status} /></Td><Td muted>{w.champion ?? "—"}</Td></tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </div>

        <div className="space-y-4">
          <FamilyTierControl familyId={f.id} tier={f.tier} />
          <InviteForm />
        </div>
      </div>
    </>
  );
}
