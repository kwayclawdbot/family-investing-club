import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { ValuationLesson } from "@/components/learn/v12/ValuationLesson";
import { getLessonQuestions } from "@/lib/data-live";

export default async function LessonPage(props: PageProps<"/lesson/[id]">) {
  const { id } = await props.params;
  if (id === "valuation") return <ValuationLesson />;
  let questions = await getLessonQuestions(id);
  if (!questions.length) questions = await getLessonQuestions("if-7");
  return <LessonPlayer lessonId={id} questions={questions} />;
}
