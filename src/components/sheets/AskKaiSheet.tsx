"use client";
import { Suspense } from "react";
import { kai } from "@/lib/data";
import { KaiSheet } from "@/components/kai/KaiSheet";

/** Kai as a sheet from anywhere (embedded mode of the existing KaiSheet). Deep link stays at /kai. */
export function AskKaiSheet({ onClose, context }: { onClose: () => void; context?: string }) {
  return (
    <Suspense fallback={null}>
      <KaiSheet embedded onClose={onClose} contextOverride={context} prompts={kai.prompts} sample={kai.sample} />
    </Suspense>
  );
}
