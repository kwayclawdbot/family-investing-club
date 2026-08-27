import { Suspense } from "react";
import { kai } from "@/lib/data-live";
import { KaiSheet } from "@/components/kai/KaiSheet";

export default function KaiPage() {
  return (
    <Suspense>
      <KaiSheet prompts={kai.prompts} sample={kai.sample} />
    </Suspense>
  );
}
