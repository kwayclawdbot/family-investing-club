import Link from "next/link";
import type { NewsItem } from "@/lib/types";

export function NewsRow({ n, last }: { n: NewsItem; last?: boolean }) {
  return (
    <Link href={`/markets/news/${n.id}`} className={`block py-[11px] ${last ? "" : "border-b border-paper-2"}`}>
      <div className="text-[13.5px] font-extrabold text-ink leading-[1.35]">{n.headline}</div>
      <div className="mt-[5px] flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-ink-3">{n.source} · {n.ago}</span>
        {n.symbols.map((s) => (
          <span key={s} className="rounded-[6px] bg-paper-2 px-[6px] py-[2px] text-[10px] font-extrabold text-ink-2">{s}</span>
        ))}
      </div>
    </Link>
  );
}
