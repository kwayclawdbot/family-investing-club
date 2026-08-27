import Link from "next/link";
import { KaiSpark } from "@/components/ui/icons";

/** Kai surfaces contextually (sheet), never as a tab — this is the entry point. */
export function KaiFab({ context }: { context?: string }) {
  const href = context ? `/kai?context=${encodeURIComponent(context)}` : "/kai";
  return (
    <Link
      href={href}
      aria-label="Ask Kai"
      className="absolute right-[18px] bottom-[96px] w-12 h-12 rounded-full bg-purple-2 text-cream-text shadow-[0_8px_20px_rgba(107,92,168,0.35)] flex items-center justify-center active:scale-95 transition"
    >
      <KaiSpark size={20} />
    </Link>
  );
}
