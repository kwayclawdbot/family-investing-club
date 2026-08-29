import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { familiesList, shortDate } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Notice, PageHeader, Stat, Table, Td, Th, TierChip } from "@/components/admin/ui";
import { InviteForm } from "@/components/admin/InviteForm";

/** Families directory — cross-tenant aggregate (service role behind the admin gate). */
export default async function AdminFamiliesPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const rows = await familiesList();
  const list = rows ?? [];
  const kids = list.reduce((n, f) => n + f.kids, 0);
  const paid = list.filter((f) => f.tier !== "free").length;

  return (
    <>
      <PageHeader title="Families" sub="The tenant. Billing, entitlement and child accounts all hang off a family." action={<InviteForm compact />} />
      {!rows && <div className="mb-5"><Notice tone="orange">The families directory needs `SUPABASE_SERVICE_ROLE_KEY` on this deployment (it is the one cross-tenant read with no RPC).</Notice></div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Families" value={list.length} />
        <Stat label="Paying" value={paid} tone="green" sub={`${list.length - paid} free / lapsed`} />
        <Stat label="Members" value={list.reduce((n, f) => n + f.members, 0)} />
        <Stat label="Kids & teens" value={kids} tone="purple" />
      </div>
      <Table minWidth={880}>
        <thead><tr><Th>Family</Th><Th>Tier</Th><Th>Door</Th><Th right>Members</Th><Th right>Kids</Th><Th>Renews</Th><Th>Created</Th><Th>Billing</Th></tr></thead>
        <tbody>
          {list.length === 0 ? <EmptyRow cols={8}>No families yet.</EmptyRow> : list.map((f) => (
            <tr key={f.id} className="hover:bg-paper-2/60">
              <Td><Link href={`/admin/families/${f.id}`} className="text-ink hover:text-green">{f.name || "Untitled family"}</Link></Td>
              <Td><TierChip tier={f.tier} />{f.club_lapsed && <Chip tone="red" className="ml-1">lapsed</Chip>}</Td>
              <Td muted>{f.door ?? "—"}</Td>
              <Td right>{f.members}</Td>
              <Td right muted>{f.kids}</Td>
              <Td muted>{shortDate(f.expires_at)}</Td>
              <Td muted>{shortDate(f.created_at)}</Td>
              <Td>{f.has_stripe ? <Chip tone="green">stripe</Chip> : <Chip>manual</Chip>}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
