import { notFound } from "next/navigation";
import { getModelPortfolio } from "@/lib/data";
import { SubHeader } from "@/components/club/SubHeader";
import { PortfolioDetail } from "@/components/club/PortfolioDetail";

export default async function ModelPortfolioPage(props: PageProps<"/club/portfolio/[id]">) {
  const { id } = await props.params;
  const p = await getModelPortfolio(id);
  if (!p) notFound();
  return (
    <>
      <SubHeader backHref="/club" title="Model portfolio" />
      <PortfolioDetail p={p} />
    </>
  );
}
