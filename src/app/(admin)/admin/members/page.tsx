import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { contacts, serverNow } from "@/lib/live/admin-crm";
import { Notice, PageHeader } from "@/components/admin/ui";
import { MembersTable } from "@/components/admin/MembersTable";
import { InviteForm } from "@/components/admin/InviteForm";

/** Members & contacts — FTA `admin_contacts` (members ∪ lead-only rows), filtered in the browser. */
export default async function AdminMembersPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const rows = await contacts({ sort: "recent", limit: 2000 });
  const nowMs = serverNow();
  return (
    <>
      <PageHeader title="Members" sub={rows ? `${rows.length} contacts — members and marketing leads in one directory.` : "Members and marketing leads in one directory."} action={<InviteForm compact />} />
      {!rows ? <Notice tone="orange">`admin_contacts` returned nothing. Check the RPC and this session&apos;s admin role.</Notice> : <MembersTable rows={rows} nowMs={nowMs} />}
    </>
  );
}
