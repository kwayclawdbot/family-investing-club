import { getPortfolio } from "@/lib/data";
import { PracticePortfolio } from "@/components/markets/PracticePortfolio";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function PracticePage() {
  const portfolio = await getPortfolio();
  return (
    <div className="pt-[14px] pb-6">
      <PracticePortfolio portfolio={portfolio} />
      <KaiFab context="practice" />
    </div>
  );
}
