import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { resolveViewAs } from "@/lib/live/admin-crm";
import { getSession, isAdmin } from "@/lib/live/session";

export const metadata: Metadata = { title: "Admin · Family Investing Club" };

/**
 * Desktop admin frame (Phase 7). Deliberately NOT the phone shell: `AdminShell` is a left-nav +
 * 1200px content column. The gate is the REAL profile role — `resolveViewAs` reads the register
 * preview cookie only after that check, so a forged cookie never reaches this layout.
 */
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const s = await getSession();
  if (!s || !isAdmin(s)) redirect("/home");
  const viewAs = await resolveViewAs(s);
  const name = s.profile?.display_name?.trim() || s.profile?.email || s.user.email || "Admin";
  return <AdminShell adminName={name} viewAs={viewAs}>{children}</AdminShell>;
}
