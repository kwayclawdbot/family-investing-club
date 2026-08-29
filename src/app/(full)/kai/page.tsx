import { Suspense } from "react";
import { getUser } from "@/lib/data-live";
import { KaiSheet } from "@/components/kai/KaiSheet";

const PROMPTS = ["Explain P/E ratio like I'm 10", "What moved the market today?", "Quiz me on dividend investing", "Help me analyze a company"];

export default async function KaiPage() {
  const user = await getUser();
  return (
    <Suspense>
      <KaiSheet prompts={PROMPTS} you={user.firstName} />
    </Suspense>
  );
}
