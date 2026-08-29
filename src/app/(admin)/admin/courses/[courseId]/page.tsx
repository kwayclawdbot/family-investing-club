import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/live/session";
import { courseDetail } from "@/lib/live/admin-crm";
import { Notice, PageHeader } from "@/components/admin/ui";
import { CourseEditor } from "@/components/admin/CourseEditor";

/** Course detail — modules and lessons, edited in place (`/api/admin/courses/*`). */
export default async function AdminCoursePage(props: PageProps<"/admin/courses/[courseId]">) {
  const s = await getSession();
  if (!isAdmin(s)) redirect("/home");
  const { courseId } = await props.params;
  const detail = await courseDetail(courseId);
  if (!detail) {
    return (
      <>
        <PageHeader title="Course" crumbs={[{ label: "Courses", href: "/admin/courses" }, { label: "Not found" }]} />
        <Notice tone="orange">No course with that id.</Notice>
      </>
    );
  }
  const lessons = detail.modules.reduce((n, m) => n + m.lessons.length, 0);
  return (
    <>
      <PageHeader
        title={detail.course.title}
        sub={`${detail.modules.length} module${detail.modules.length === 1 ? "" : "s"} · ${lessons} lesson${lessons === 1 ? "" : "s"}`}
        crumbs={[{ label: "Courses", href: "/admin/courses" }, { label: detail.course.title }]}
      />
      <CourseEditor detail={detail} />
    </>
  );
}
