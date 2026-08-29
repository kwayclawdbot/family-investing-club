import { notFound } from "next/navigation";
import { SessionView } from "@/components/live/SessionView";
import { getLiveItem } from "@/lib/live/learning";

/** A live class or its recording — the real row, with a signed URL for uploaded recordings. */
export default async function SessionPage(props: PageProps<"/live/[id]">) {
  const { id } = await props.params;
  const item = await getLiveItem(id);
  if (!item) notFound();
  return <SessionView item={item} />;
}
