import { notFound } from "next/navigation";
import { getCompany, getPortfolio, getOrders } from "@/lib/data";
import { TopBar } from "@/components/shell/TopBar";
import { TradeFlow } from "@/components/markets/TradeFlow";

export default async function TradePage(props: PageProps<"/practice/trade/[symbol]">) {
  const { symbol } = await props.params;
  const c = await getCompany(symbol);
  if (!c) notFound();
  const [portfolio, orders] = await Promise.all([getPortfolio(), getOrders()]);
  return (
    <div className="-mx-[18px] pb-6">
      <TopBar backHref={`/markets/${c.symbol}`} title={`Practice · ${c.symbol}`} />
      <div className="px-[18px]">
        <TradeFlow company={c} portfolio={portfolio} fixtureOrders={orders} />
      </div>
    </div>
  );
}
