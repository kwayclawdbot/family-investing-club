import { Flashcards } from "@/components/learn/Flashcards";
import { getFlashcards } from "@/lib/data-live";

export default async function ReviewPage() {
  const cards = await getFlashcards();
  return <Flashcards cards={cards} />;
}
