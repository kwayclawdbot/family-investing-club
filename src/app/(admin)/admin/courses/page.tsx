import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { coursesList, shortDate } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Notice, PageHeader, Stat, Table, Td, Th } from "@/components/admin/ui";
import { CourseRowActions, NewCourseButton } from "@/components/admin/CourseEditor";

/** Courses — `courses` + module/lesson counts. Interactive `steps` go live from Lesson drafts. */
export default async function AdminCoursesPage() {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const rows = await coursesList();
  const list = rows ?? [];
  const published = list.filter((c) => c.published).length;

  return (
    <>
      <PageHeader title="Courses" sub="The catalogue members see in Learn. Unpublished courses stay invisible to everyone but you." action={<NewCourseButton />} />
      {!rows && <div className="mb-5"><Notice tone="orange">Couldn&apos;t read `courses`.</Notice></div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Courses" value={list.length} sub={`${published} published`} />
        <Stat label="Modules" value={list.reduce((n, c) => n + c.module_count, 0)} />
        <Stat label="Live lessons" value={list.reduce((n, c) => n + c.lesson_count, 0)} tone="green" />
        <Stat label="Drafts" value={list.length - published} tone={list.length - published ? "orange" : undefined} />
      </div>
      <Table minWidth={920}>
        <thead><tr><Th>Course</Th><Th>Tier</Th><Th>Program</Th><Th right>Modules</Th><Th right>Lessons</Th><Th right>Order</Th><Th>Created</Th><Th right>Actions</Th></tr></thead>
        <tbody>
          {list.length === 0 ? <EmptyRow cols={8}>No courses yet.</EmptyRow> : list.map((c) => (
            <tr key={c.id} className="hover:bg-paper-2/60">
              <Td>
                <Link href={`/admin/courses/${c.id}`} className="block min-w-0">
                  <span className="text-ink">{c.title}</span>
                  <span className="block text-[11.5px] text-ink-3">/{c.slug}</span>
                </Link>
              </Td>
              <Td><Chip tone={c.published ? "green" : "muted"}>{c.published ? "published" : "draft"}</Chip><Chip tone="gold" className="ml-1">{c.min_tier ?? "—"}</Chip></Td>
              <Td muted>{c.program ?? "—"}</Td>
              <Td right>{c.module_count}</Td>
              <Td right>{c.lesson_count}</Td>
              <Td right muted>{c.sort_order}</Td>
              <Td muted className="whitespace-nowrap">{shortDate(c.created_at)}</Td>
              <Td right><CourseRowActions course={c} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
