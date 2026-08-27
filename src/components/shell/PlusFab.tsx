"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SheetHost } from "@/components/sheets/SheetHost";
import { XpToastHost } from "@/components/sheets/XpToast";
import { useSheet } from "@/components/sheets/bus";
import { PlusWheel } from "./PlusWheel";

/** Prototype v2: the ＋ is back — one orange button, the quarter-wheel spins out of it. `?plus=1` opens it on load. */
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
  const sheet = useSheet();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // open after mount only (server renders closed → no hydration mismatch on ?plus=1)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred open from the URL param
  useEffect(() => { if (initialOpen) setOpen(true); }, [initialOpen]);
  const showWheel = open && !sheet;
  // rooms have their own composer; company pages carry a sticky Make a Pick bar
  const hidden = path.startsWith("/circle/") || /^\/discover\/[^/]+$/.test(path);
  return (
    <>
      {showWheel && <PlusWheel onClose={() => setOpen(false)} />}
      {!sheet && !hidden && (
        <button type="button" aria-label={open ? "Close" : "What do you want to do?"} aria-expanded={open} onClick={() => setOpen((v) => !v)}
          className={`absolute right-[18px] bottom-[118px] z-[48] w-14 h-14 rounded-full bg-orange text-cream-text flex items-center justify-center active:scale-95 transition ${open ? "shadow-[0_6px_16px_rgba(201,109,37,0.5),0_0_0_5px_rgba(255,253,247,0.9)]" : "shadow-[0_6px_16px_rgba(201,109,37,0.45)]"}`}>
          <span className={`text-[26px] font-black leading-none inline-block transition-transform ${open ? "rotate-45" : ""}`}>＋</span>
        </button>
      )}
      <SheetHost />
      <XpToastHost />
    </>
  );
}
