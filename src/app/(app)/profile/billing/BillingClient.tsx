"use client";
import { useState } from "react";
import { Button } from "@/components/ui";

/**
 * Member billing actions. Talks only to the platform routes:
 *   POST /api/billing/portal  → Stripe Customer Portal (card, invoices, cancel)
 *   POST /api/club/checkout   → hosted Stripe Checkout for the $99/mo Club membership
 * Nothing commercial lives in the browser — prices and metadata are server-side.
 */
export function BillingActions({ portalAvailable, showJoin }: { portalAvailable: boolean; showJoin: boolean }) {
  const [busy, setBusy] = useState<null | "portal" | "join">(null);
  const [error, setError] = useState<string | null>(null);

  async function go(kind: "portal" | "join") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(kind === "portal" ? "/api/billing/portal" : "/api/club/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "portal" ? { returnTo: "/profile/billing" } : { src: "in_app_upgrade" }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string; reason?: string };
      if (res.ok && json.url) {
        window.location.assign(json.url);
        return;
      }
      setError(
        json.reason === "no_customer"
          ? "No billing account on file yet — email support@familyinvestingclub.com and we'll sort it."
          : json.error || "Couldn't open billing right now. Try again in a moment."
      );
    } catch {
      setError("Couldn't reach billing. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {portalAvailable && (
          <Button size="md" variant="green" className="flex-1" disabled={busy !== null} onClick={() => go("portal")}>
            {busy === "portal" ? "Opening…" : "Manage billing"}
          </Button>
        )}
        {showJoin && (
          <Button size="md" variant={portalAvailable ? "secondary" : "green"} className="flex-1" disabled={busy !== null} onClick={() => go("join")}>
            {busy === "join" ? "Opening…" : "Join the Club · $99/mo"}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-[12px] font-bold text-coral">{error}</p>}
    </div>
  );
}
