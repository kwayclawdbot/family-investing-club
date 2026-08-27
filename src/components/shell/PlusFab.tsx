"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SheetHost } from "@/components/sheets/SheetHost";
import { XpToastHost } from "@/components/sheets/XpToast";
import { openSheet, useSheet } from "@/components/sheets/bus";

/** ✎ Share (canvas v11): one orange pill; opens the Compose modal. Small actions stay sheets. `?compose=1` opens it on load. */
export function PlusFab() {
  return (
    <Suspense fallback={<FabInner />}>
      <FabWithParams />
    </Suspense>
  );
}
function FabWithParams() {
  const sp = useSearchParams();
  const open = sp.get("compose") === "1";
  useEffect(() => { if (open) openSheet("compose", { audience: sp.get("to") ?? "main" }); }, [open, sp]);
  return <FabInner />;
}
function FabInner() {
  const sheet = useSheet();
  const path = usePathname();
  const hidden = path.startsWith("/circle/"); // rooms have their own composer (board 14)
  return (
    <>
      {!sheet && !hidden && (
        <button type="button" aria-label="Share something" onClick={() => openSheet("compose")} className="absolute right-[18px] bottom-[118px] z-[45] flex items-center gap-2 rounded-[28px] bg-orange text-cream-text px-[18px] py-[13px] shadow-[0_6px_16px_rgba(201,109,37,0.45)] active:scale-95 transition">
          <span className="text-[16px] font-black leading-none">✎</span><span className="text-[13px] font-black">Share</span>
        </button>
      )}
      <SheetHost />
      <XpToastHost />
    </>
  );
}
