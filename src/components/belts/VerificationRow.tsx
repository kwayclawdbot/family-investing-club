"use client";
import Link from "next/link";
import { useBrokerage } from "@/components/verify/storage";

export function VerificationRow() {
  const { brokerage } = useBrokerage();
  return (
    <div className="flex justify-between items-center py-[10px] border-b border-paper-2">
      <span className="text-[12.5px] font-extrabold text-ink">Verification</span>
      {brokerage ? (
        <Link href="/profile/privacy" className="bg-green-tint text-green rounded-[7px] px-[9px] py-[2px] text-[10px] font-black">VERIFIED OWNER ✓</Link>
      ) : (
        <Link href="/profile/brokerage" className="text-[11px] font-extrabold text-ink-3">Not connected ›</Link>
      )}
    </div>
  );
}
