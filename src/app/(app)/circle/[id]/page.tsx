import { notFound } from "next/navigation";
import { CircleRoom } from "@/components/circles/CircleRoom";
import { getCircleRoom } from "@/lib/live/community";
import { getCompany } from "@/lib/data-live";

/** Circle — a real `club_circles` room by id or slug. 30 days, then read-only. */
export default async function CirclePage(props: PageProps<"/circle/[id]">) {
  const { id } = await props.params;
  const room = await getCircleRoom(id);
  if (!room) notFound();
  const company = room.circle.symbol ? await getCompany(room.circle.symbol) : undefined;
  const quote = company ? { price: company.price, changePct: company.changePct } : null;
  return <CircleRoom room={room} quote={quote} />;
}
