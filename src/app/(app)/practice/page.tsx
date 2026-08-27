import { getPortfolio, getOrders, getCompanies } from "@/lib/data";
import { PracticePortfolio } from "@/components/markets/PracticePortfolio";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function PracticePage() {
  const [portfolio, orders, companies] = await Promise.all([getPortfolio(), getOrders(), getCompanies()]);
  return (
    <div className="pt-[14px] pb-6">
      <PracticePortfolio portfolio={portfolio} orders={orders} companies={companies} />
      <KaiFab context="practice" />
    </div>
  );
}
