"use client";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { Company } from "@/lib/types";
import { Card } from "@/components/ui";
import { SearchField } from "./SearchField";
import { Sparkline } from "./LineChart";
import { money, pct, tileTone } from "./format";

export function CompanyList({ companies, tiles }: { companies: Company[]; tiles?: ReactNode }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return companies;
    return companies.filter((c) => c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
  }, [q, companies]);

  return (
    <>
      <SearchField value={q} onChange={setQ} />
      {!q && tiles}
      <h2 className="mt-4 text-[15px] font-black text-ink">{q ? "Results" : "Companies you're learning about"}</h2>
      <Card className="mt-2 !py-1 !px-4">
        {list.length === 0 && (
          <div className="py-6 text-center text-[13px] font-bold text-ink-3">
            No companies match “{q}”. Try a ticker like AAPL.
          </div>
        )}
        {list.map((c, i) => {
          const up = c.change >= 0;
          return (
            <Link
              key={c.symbol}
              href={`/markets/${c.symbol}`}
              className={`flex items-center gap-[11px] py-[11px] ${i < list.length - 1 ? "border-b border-paper-2" : ""}`}
            >
              <span className={`w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[11px] font-black shrink-0 ${tileTone(c.symbol)}`}>
                {c.symbol.slice(0, 4)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-ink truncate">{c.name}</div>
                <div className="text-[11px] font-bold text-ink-4">{c.symbol}</div>
              </div>
              <Sparkline data={c.series["1D"]} color={up ? "#3A8C4A" : "#C96A57"} />
              <div className="text-right w-[70px]">
                <div className="text-[13.5px] font-black text-ink">${money(c.price)}</div>
                <div className={`text-[11px] font-extrabold ${up ? "text-[#3A8C4A]" : "text-red"}`}>{pct(c.changePct, 2)}</div>
              </div>
            </Link>
          );
        })}
      </Card>
    </>
  );
}
