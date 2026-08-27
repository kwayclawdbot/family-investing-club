import { Flashcards } from "@/components/learn/Flashcards";
import { getFlashcards } from "@/lib/data";

export default async function ReviewPage() {
  const cards = await getFlashcards();
  return <Flashcards cards={cards} />;
}
