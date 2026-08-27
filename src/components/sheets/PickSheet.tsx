"use client";
import { useEffect, useState } from "react";
import { getClub, getCompanies, costcoQuote } from "@/lib/data";
import type { Club, Company } from "@/lib/types";
import { PickComposer } from "@/components/club/PickComposer";
import { SheetFrame } from "./SheetFrame";
import { showXp } from "./bus";

/** The existing Pick composer, as a sheet from the ＋ (v9: sheets over routes). */
export function PickSheet({ onClose, symbol }: { onClose: () => void; symbol?: string }) {
  const [data, setData] = useState<{ club: Club; companies: Company[] } | null>(null);
  useEffect(() => { Promise.all([getClub(), getCompanies()]).then(([club, companies]) => setData({ club, companies })); }, []);
  return (
    <SheetFrame title="Make a Pick" onClose={onClose}>
      {data ? (
        <PickComposer embedded club={data.club} companies={data.companies} costco={costcoQuote} initialSymbol={symbol} onDone={(shared) => { if (shared) showXp(8); onClose(); }} />
      ) : (
        <div className="py-10 text-center text-[12px] font-bold text-ink-3">Loading…</div>
      )}
    </SheetFrame>
  );
}
