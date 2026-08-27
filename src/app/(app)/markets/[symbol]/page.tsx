import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/data";
import { Card, ButtonLink, Tag } from "@/components/ui";
import { SearchField } from "@/components/markets/SearchField";
import { CompanyChart } from "@/components/markets/CompanyChart";
import { money, signed, pct } from "@/components/markets/format";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function CompanyPage(props: PageProps<"/markets/[symbol]">) {
  const { symbol } = await props.params;
  const c = await getCompany(symbol);
  if (!c) notFound();
  const up = c.change >= 0;
  const firstName = c.name.split(" ")[0].replace(/,$/, "");

  return (
    <div className="pt-[14px] pb-6">
      <Link href="/markets" className="block">
        <SearchField />
      </Link>

      <div className="flex items-start justify-between mt-4">
        <div>
          <h1 className="text-[22px] font-black text-ink">{c.name}</h1>
          <div className="text-[13px] font-extrabold text-ink-3">{c.symbol}</div>
        </div>
        <div className="w-[52px] h-[52px] rounded-[16px] border border-line flex items-center justify-center text-[8px] font-mono text-ink-5 [background:repeating-linear-gradient(45deg,#F0E6D0_0_7px,#F7EFDD_7px_14px)]">
          logo
        </div>
      </div>
      <div className="mt-1 text-[30px] font-black text-ink">${money(c.price)}</div>
      <div className={`text-[13.5px] font-extrabold ${up ? "text-[#3A8C4A]" : "text-red"}`}>
        {signed(c.change)} ({pct(c.changePct, 2).slice(1)}) today
      </div>

      <CompanyChart series={c.series} ranges={["1D", "1W", "1M", "3M", "1Y", "5Y"]} color={up ? "#4C8C4A" : "#C96A57"} />

      <h2 className="mt-[14px] text-[15px] font-black text-ink">Understand {firstName}</h2>
      <Card className="mt-2 !py-1 !px-4">
        {c.understand.map((u, i) => (
          <Link
            key={u.q}
            href={`/kai?context=${encodeURIComponent(`symbol:${c.symbol}`)}&q=${encodeURIComponent(u.q)}`}
            className={`flex items-center gap-[10px] py-[11px] ${i < c.understand.length - 1 ? "border-b border-paper-2" : ""}`}
          >
            <span className="text-orange font-black">+</span>
            <span className="flex-1 text-[13.5px] font-extrabold text-ink">
              {u.q}
              {u.concept && <Tag tone="purple" className="ml-1 !rounded-[8px] !text-[10.5px]">{u.concept}</Tag>}
            </span>
          </Link>
        ))}
      </Card>

      <ButtonLink href="/practice" full className="mt-3 !h-[50px] !text-[14.5px] shadow-[0_3px_0_#C96D25]">
        Practice Analyzing {firstName}
      </ButtonLink>

      <KaiFab context={`symbol:${c.symbol}`} />
    </div>
  );
}
