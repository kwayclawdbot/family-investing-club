import { notFound } from "next/navigation";
import { CircleRoom } from "@/components/circles/CircleRoom";
import { circleById, circleMessages } from "@/lib/fixtures/v12-social";
import { getCompany } from "@/lib/data-live";

/** Circle — "this event" (canvas v11, board 14). 30-day room; archives read-only to the company page on expiry. */
export default async function CirclePage(props: PageProps<"/circle/[id]">) {
  const { id } = await props.params;
  const c = circleById(id);
  if (!c) notFound();
  const company = c.symbol ? await getCompany(c.symbol) : undefined;
  const quote = company ? { price: company.price, changePct: company.changePct } : null;
  return <CircleRoom c={c} messages={circleMessages[c.id] ?? []} quote={quote} />;
}
