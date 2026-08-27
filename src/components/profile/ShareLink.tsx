"use client";
import { Button } from "@/components/ui";
import { useShare } from "./useLocal";

export function ShareLink({ link, code }: { link: string; code: string }) {
  const { share, copied } = useShare(`Learn investing with our family on FIC — join with my link: ${link}`, link);
  return (
    <div className="bg-green-tint border border-green-line rounded-card px-4 py-4 text-center">
      <div className="text-[11px] font-black text-green tracking-[0.5px]">YOUR INVITE CODE</div>
      <div className="mt-1 text-[26px] font-black text-ink tracking-[2px]">{code}</div>
      <div className="mt-2 text-[11.5px] font-bold text-ink-3 break-all">{link}</div>
      <Button size="md" variant="green" onClick={share} className="mt-3">{copied ? "Link copied!" : "Share your link"}</Button>
    </div>
  );
}
