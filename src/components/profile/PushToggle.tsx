"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPushStatus, subscribeToPush, unsubscribeFromPush, type PushStatus } from "@/lib/push-client";
import { Toggle } from "@/components/ui/extras";

/**
 * The one control that actually turns push on for this device.
 *
 * Everything else shipped in Phase 6 — `/api/push/dispatch`, `public/sw.js`, the VAPID keys and the
 * `dispatch_push_notification()` trigger — but nothing in the app ever registered the service worker
 * or wrote a `push_subscriptions` row, so no member could receive a notification. This is that step.
 * `subscribeToPush` must run inside the click gesture (iOS rejects a prompt otherwise).
 */
const COPY: Record<PushStatus, string> = {
  subscribed: "On for this device",
  ready: "Off — turn on to get club votes, replies and alerts",
  denied: "Blocked in your browser settings — allow notifications for this site, then try again",
  unsupported: "This browser can't do push notifications",
  "ios-needs-install": "On iPhone, add FIC to your Home Screen first, then turn this on",
};

export function PushToggle({ userId }: { userId: string }) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void getPushStatus().then(setStatus); }, []);

  const toggle = async (on: boolean) => {
    if (busy) return;
    setBusy(true); setError(null);
    const supabase = createClient();
    if (on) {
      const r = await subscribeToPush(supabase, userId);
      setStatus(r.status);
      if (!r.ok && r.error) setError(r.error);
    } else {
      await unsubscribeFromPush(supabase);
      setStatus("ready");
    }
    setBusy(false);
  };

  const on = status === "subscribed";
  const blocked = status === "denied" || status === "unsupported" || status === "ios-needs-install";
  return (
    <div className="flex items-center justify-between gap-3 py-[11px]">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-extrabold text-ink">Push notifications</div>
        <div className="text-[10.5px] font-bold text-ink-3">{status ? COPY[status] : "Checking…"}</div>
        {error && <div role="alert" className="text-[10.5px] font-bold text-coral">{error}</div>}
      </div>
      <Toggle checked={on} onChange={(v) => void toggle(v)} label="Push notifications" disabled={busy || blocked || !status} />
    </div>
  );
}
