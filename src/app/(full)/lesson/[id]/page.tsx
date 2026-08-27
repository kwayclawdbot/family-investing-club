import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { getLessonQuestions } from "@/lib/data";

export default async function LessonPage(props: PageProps<"/lesson/[id]">) {
  const { id } = await props.params;
  let questions = await getLessonQuestions(id);
  if (!questions.length) questions = await getLessonQuestions("if-7");
  return <LessonPlayer lessonId={id} questions={questions} />;
}
