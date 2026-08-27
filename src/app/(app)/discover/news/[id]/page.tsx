import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsItem, getCompanies } from "@/lib/data";
import { Card } from "@/components/ui";
import { ConceptChip } from "@/components/ui/extras";
import { KaiSpark, ChevronRight } from "@/components/ui/icons";
import { TopBar } from "@/components/shell/TopBar";
import { SymbolTile } from "@/components/markets/SymbolTile";
import { conceptOf } from "@/components/markets/concepts";
import { money, pct } from "@/components/markets/format";

export default async function NewsItemPage(props: PageProps<"/discover/news/[id]">) {
  const { id } = await props.params;
  const n = await getNewsItem(id);
  if (!n) notFound();
  const companies = (await getCompanies()).filter((c) => n.symbols.includes(c.symbol));

  return (
    <div className="-mx-[18px] pb-6">
      <TopBar backHref="/discover/news" />
      <div className="px-[18px]">
        <h1 className="text-[22px] font-black text-ink leading-[1.25]">{n.headline}</h1>
        <div className="mt-2 text-[12px] font-bold text-ink-3">{n.source} · {n.ago}</div>

        <Card tone="green" className="mt-4">
          <div className="text-[11px] font-extrabold text-green tracking-[0.3px]">WHY THIS MATTERS</div>
          <p className="mt-1 text-[14px] font-bold text-ink leading-[1.5]">{n.whyItMatters}</p>
        </Card>

        <p className="mt-4 text-[14px] font-bold text-ink-2 leading-[1.6]">{n.body}</p>

        <div className="mt-4 flex flex-wrap gap-[6px]">
          {n.concepts.map((c) => {
            const d = conceptOf(c);
            return <ConceptChip key={c} label={c} definition={d.definition} lessonHref={d.lessonHref} />;
          })}
        </div>

        <Link href={`/kai?context=${encodeURIComponent(`news:${n.id}`)}`} className="mt-4 flex items-center gap-[10px] bg-purple-tint border border-purple-line rounded-[14px] px-[14px] py-3">
          <span className="w-7 h-7 rounded-[10px] bg-purple text-white flex items-center justify-center shrink-0"><KaiSpark size={14} /></span>
          <span className="flex-1 text-[13px] font-extrabold text-purple-2">Ask Kai to explain this story</span>
          <ChevronRight className="text-purple-2" />
        </Link>

        {companies.length > 0 && (
          <>
            <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Companies in this story</h2>
            <Card className="!py-1 !px-4">
              {companies.map((c, i) => (
                <Link key={c.symbol} href={`/discover/${c.symbol}`} className={`flex items-center gap-[11px] py-[11px] ${i < companies.length - 1 ? "border-b border-paper-2" : ""}`}>
                  <SymbolTile symbol={c.symbol} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-extrabold text-ink truncate">{c.name}</span>
                    <span className="block text-[11px] font-bold text-ink-4">{c.symbol}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[13.5px] font-black text-ink">${money(c.price)}</span>
                    <span className={`block text-[11px] font-extrabold ${c.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{pct(c.changePct, 2)}</span>
                  </span>
                </Link>
              ))}
            </Card>
          </>
        )}
        <p className="mt-4 text-[11px] font-bold text-ink-4 text-center">Sample story for learning · not investment advice</p>
      </div>
    </div>
  );
}
