"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";

export function BillingActions() {
  const [open, setOpen] = useState<null | "manage" | "cancel">(null);
  return (
    <>
      <div className="flex gap-2">
        <Button size="md" variant="green" className="flex-1" onClick={() => setOpen("manage")}>Manage plan</Button>
        <Button size="md" variant="secondary" className="flex-1" onClick={() => setOpen("cancel")}>Cancel</Button>
      </div>
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open === "cancel" ? "Cancel plan" : "Manage plan"}>
        <p className="text-[14px] font-bold text-ink-2 leading-[1.55]">
          Billing management opens when Stripe is connected to FIC. Until then, email <b className="text-ink">support@familyinvestingclub.com</b> and we&apos;ll {open === "cancel" ? "cancel it for you — you keep access until the end of the period." : "make the change for you."}
        </p>
      </Sheet>
    </>
  );
}
