"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlusWheel } from "@/components/shell/PlusWheel";
import { SheetHost } from "@/components/sheets/SheetHost";
import { XpToastHost } from "@/components/sheets/XpToast";

/** The universal ＋ (canvas v9): one orange button; small actions open as sheets — never routes. */
export function PlusFab() {
  return (
    <Suspense fallback={<FabInner initialOpen={false} />}>
      <FabWithParams />
    </Suspense>
  );
}

function FabWithParams() {
  const sp = useSearchParams();
  return <FabInner initialOpen={sp.get("plus") === "1"} />;
}

function FabInner({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (initialOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- proof/deep-link: open the wheel on load
      setOpen(true);
    }
  }, [initialOpen]);
  return (
    <>
      {open && <PlusWheel onClose={() => setOpen(false)} />}
      <button
        type="button"
        aria-label={open ? "Close actions" : "What do you want to do?"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`absolute right-[18px] bottom-[118px] z-[48] w-14 h-14 rounded-full bg-orange text-cream-text flex items-center justify-center active:scale-95 transition ${open ? "shadow-[0_6px_16px_rgba(201,109,37,0.5),0_0_0_5px_rgba(255,253,247,0.9)]" : "shadow-[0_6px_16px_rgba(201,109,37,0.45)]"}`}
      >
        <span className={`text-[26px] font-black leading-none inline-block transition-transform duration-200 ${open ? "rotate-45" : ""}`}>＋</span>
      </button>
      <SheetHost />
      <XpToastHost />
    </>
  );
}
