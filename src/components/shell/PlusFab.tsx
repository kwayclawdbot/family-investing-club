"use client";
import { useState } from "react";
import { PlusWheel } from "@/components/shell/PlusWheel";

/** The universal ＋ (canvas v9): one orange button, small actions open as sheets — never routes. */
export function PlusFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close actions" : "What do you want to do?"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="absolute right-[18px] bottom-[118px] z-[48] w-14 h-14 rounded-full bg-orange text-cream-text shadow-[0_6px_16px_rgba(201,109,37,0.45)] flex items-center justify-center active:scale-95 transition"
      >
        <span className={`text-[26px] font-black leading-none transition-transform ${open ? "rotate-45" : ""}`}>＋</span>
      </button>
      {open && <PlusWheel onClose={() => setOpen(false)} />}
    </>
  );
}
