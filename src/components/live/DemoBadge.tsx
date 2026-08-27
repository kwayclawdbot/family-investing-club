import Link from "next/link";
import { dataMode } from "@/lib/live/mode";

/** "Demo data" pill — render on any page; shows only while signed out. */
export async function DemoBadge({ className = "" }: { className?: string }) {
  if ((await dataMode()) === "live") return null;
  return (
    <Link
      href="/login"
      className={`inline-flex items-center gap-1 rounded-[8px] bg-orange-tint border border-orange-line px-2 py-[3px] text-[10px] font-extrabold text-orange-2 ${className}`}
    >
      Demo data · sign in to see your club
    </Link>
  );
}
