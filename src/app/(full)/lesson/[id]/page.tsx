import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson/LessonView";
import { ValuationLesson } from "@/components/learn/v12/ValuationLesson";
import { getLessonData } from "@/lib/live/learning";

/** A lesson from the real curriculum: the step engine for stepped lessons, the legacy viewer for video. */
export default async function LessonPage(props: PageProps<"/lesson/[id]">) {
  const { id } = await props.params;
  // `/lesson/valuation` is the designed concept lesson linked from company pages, not a course row.
  if (id === "valuation") return <ValuationLesson />;
  const lesson = await getLessonData(id);
  if (!lesson) notFound();
  return <LessonView lesson={lesson} />;
}
