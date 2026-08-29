import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { adminNotes, contactSupport, dateTime, memberById, memberTimeline, relativeTime, serverNow, shortDate } from "@/lib/live/admin-crm";
import { AdminAvatar, Chip, Notice, PageHeader, Panel, RoleChip, SeenDot, Stat, StatusChip, Table, Td, Th, TierChip } from "@/components/admin/ui";
import { MemberControls, NotesPanel } from "@/components/admin/MemberPanel";

/** Member detail — `admin_member_activity` row + `admin_member_timeline` + `admin_notes` + their tickets. */
export default async function AdminMemberPage(props: PageProps<"/admin/members/[userId]">) {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const { userId } = await props.params;
  const nowMs = serverNow();
  const [m, timeline, notes, tickets] = await Promise.all([memberById(userId), memberTimeline(userId, 60), adminNotes(userId), contactSupport(userId)]);

  if (!m) {
    return (
      <>
        <PageHeader title="Member" crumbs={[{ label: "Members", href: "/admin/members" }, { label: "Not found" }]} />
        <Notice tone="orange">No member with that id in `admin_member_activity`. They may be a lead — try the <Link href="/admin/pipeline" className="underline">pipeline</Link>.</Notice>
      </>
    );
  }

  const stats: { label: string; value: number }[] = [
    { label: "XP", value: m.xp_total }, { label: "Lessons", value: m.lessons_completed }, { label: "Quizzes passed", value: m.quizzes_passed },
    { label: "Posts", value: m.posts }, { label: "Comments", value: m.comments }, { label: "Missions", value: m.missions },
    { label: "Watchlist", value: m.watchlist_adds }, { label: "RSVPs", value: m.rsvps }, { label: "Badges", value: m.badges }, { label: "Chat", value: m.chat_messages },
  ];

  return (
    <>
      <PageHeader
        title={m.display_name || m.email || "Member"}
        sub={[m.email, m.family_name, m.track].filter(Boolean).join(" · ") || undefined}
        crumbs={[{ label: "Members", href: "/admin/members" }, { label: m.display_name || "Member" }]}
        action={<Link href="/home" className="h-[40px] px-[18px] rounded-[12px] inline-flex items-center text-[13.5px] font-black bg-card border border-line text-ink">Open the member app ↗</Link>}
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="space-y-4">
          <Panel>
            <div className="flex items-center gap-3 flex-wrap">
              <AdminAvatar name={m.display_name} url={m.avatar_url} size={48} />
              <div className="min-w-0">
                <div className="text-[18px] font-black text-ink truncate">{m.display_name || "—"}</div>
                <div className="text-[12.5px] font-bold text-ink-3 truncate">{m.email ?? "no email"}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                <RoleChip role={m.role} />
                <TierChip tier={m.tier} />
                {m.age_group && <Chip>{m.age_group}</Chip>}
                {m.club_lapsed && <Chip tone="red">lapsed</Chip>}
                {!m.onboarding_complete && <Chip tone="orange">onboarding</Chip>}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 flex-wrap text-[12px] font-bold text-ink-3">
              <span><SeenDot iso={m.last_seen} nowMs={nowMs} />Last seen {relativeTime(m.last_seen)}</span>
              <span>Joined {shortDate(m.joined_at)}</span>
              {m.club_until && <span>Club until {shortDate(m.club_until)}</span>}
              {m.family_id && <Link href={`/admin/families/${m.family_id}`} className="text-green font-extrabold hover:underline">{m.family_name || "Their family"} →</Link>}
            </div>
          </Panel>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {stats.map((x) => <Stat key={x.label} label={x.label} value={x.value} />)}
          </div>

          <Panel title="Activity timeline">
            <ul className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {(timeline ?? []).length === 0 && <li className="text-[12.5px] font-bold text-ink-4">Nothing recorded yet.</li>}
              {(timeline ?? []).map((e, i) => (
                <li key={`${e.ts}-${i}`} className="flex items-start gap-2.5">
                  <Chip className="mt-[2px] shrink-0">{e.type}</Chip>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-extrabold text-ink truncate">{e.title}</div>
                    {e.meta && <div className="text-[11.5px] font-bold text-ink-4 truncate">{e.meta}</div>}
                  </div>
                  <span className="text-[11.5px] font-bold text-ink-4 whitespace-nowrap">{dateTime(e.ts)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Support tickets">
            <Table minWidth={520} className="border-0">
              <thead><tr><Th>Subject</Th><Th>Category</Th><Th>Status</Th><Th right>Messages</Th><Th>Last message</Th></tr></thead>
              <tbody>
                {(tickets ?? []).length === 0 ? <tr><td colSpan={5} className="px-3 py-6 text-center text-[12.5px] font-bold text-ink-4">No tickets.</td></tr> : (tickets ?? []).map((t) => (
                  <tr key={t.id}>
                    <Td><Link href={`/admin/support?ticket=${t.id}`} className="text-ink hover:text-green">{t.subject}</Link></Td>
                    <Td muted>{t.category}</Td>
                    <Td><StatusChip status={t.status} /></Td>
                    <Td right muted>{t.message_count}</Td>
                    <Td muted>{relativeTime(t.last_message_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </div>

        <div className="space-y-4">
          <MemberControls userId={m.id} role={m.role} ageGroup={m.age_group} self={s?.user.id === m.id} />
          <NotesPanel userId={m.id} notes={notes ?? []} />
          <Panel title="Register preview">
            <p className="text-[12.5px] font-bold text-ink-2 leading-[1.5]">Use the <span className="font-black text-purple-2">View as</span> bar at the top to open the member shell as a parent, teen, kid or free family, then hit <Link href="/home" className="text-green font-extrabold hover:underline">the app</Link>. It reshapes the shell only — you always read your own rows under real RLS.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
