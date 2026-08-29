import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { learnDrafts } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Notice, PageHeader, Stat, Table, Td, Th } from "@/components/admin/ui";
import { PublishDraftButton } from "@/components/admin/SmallActions";

/** Lesson drafts — `list_learn_drafts`; publish copies `steps_draft` → `steps` (`publish_lesson_draft`). */
export default async function AdminDraftsPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const rows = await learnDrafts();
  const list = rows ?? [];
  const pending = list.filter((d) => d.has_draft && !d.in_sync).length;

  return (
    <>
      <PageHeader title="Lesson drafts" sub="Interactive `steps` lessons. A draft is invisible to members until it is published; publishing swaps it in without touching progress." crumbs={[{ label: "Courses", href: "/admin/courses" }, { label: "Lesson drafts" }]} />
      {!rows && <div className="mb-5"><Notice tone="orange">`list_learn_drafts` returned nothing.</Notice></div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Step lessons" value={list.length} />
        <Stat label="Published" value={list.filter((d) => d.is_published).length} tone="green" />
        <Stat label="Unpublished edits" value={pending} tone={pending ? "orange" : undefined} />
        <Stat label="In sync" value={list.filter((d) => d.in_sync).length} />
      </div>
      <Table minWidth={900}>
        <thead><tr><Th>Lesson</Th><Th>Course</Th><Th>Module</Th><Th>State</Th><Th right>Publish</Th></tr></thead>
        <tbody>
          {list.length === 0 ? <EmptyRow cols={5}>No step lessons yet.</EmptyRow> : list.map((d) => (
            <tr key={d.lesson_id} className="hover:bg-paper-2/60">
              <Td><span className="text-ink">{d.lesson_sort + 1}. {d.lesson_title}</span></Td>
              <Td muted><Link href={`/admin/courses?course=${d.course_slug}`} className="hover:text-green">{d.course_title}</Link></Td>
              <Td muted>{d.module_title}{d.module_track ? ` · ${d.module_track}` : ""}</Td>
              <Td>
                {d.is_published ? <Chip tone="green">live</Chip> : <Chip>not live</Chip>}
                {d.has_draft && <Chip tone={d.in_sync ? "muted" : "orange"} className="ml-1">{d.in_sync ? "draft = live" : "draft ahead"}</Chip>}
              </Td>
              <Td right>
                {d.has_draft && !d.in_sync && <PublishDraftButton lessonId={d.lesson_id} action="publish" label="Publish draft" />}
                {d.is_published && d.in_sync && <PublishDraftButton lessonId={d.lesson_id} action="unpublish" label="Unpublish" />}
                {!d.has_draft && !d.is_published && <span className="text-[12px] font-bold text-ink-4">nothing to publish</span>}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
