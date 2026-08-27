import { notFound } from "next/navigation";
import { getModelPortfolio } from "@/lib/data-live";
import { PortfolioDetail } from "@/components/club/PortfolioDetail";

/** Artboard 27 — Club Model Portfolio (public, educational). */
export default async function ModelPortfolioPage(props: PageProps<"/club/portfolio/[id]">) {
  const { id } = await props.params;
  const p = await getModelPortfolio(id);
  if (!p) notFound();
  return <PortfolioDetail p={p} />;
}
