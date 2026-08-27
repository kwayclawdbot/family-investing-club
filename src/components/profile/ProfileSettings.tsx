"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkRow } from "@/components/ui/extras";

export function ProfileSettings({ familyName, level }: { familyName: string; level: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try { await createClient().auth.signOut(); } catch { /* not signed in */ }
    router.replace("/welcome");
  }
  return (
    <>
      <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
        <LinkRow href="/family" icon="👨‍👩‍👧‍👦" title={familyName} sub="Members, controls, invites" />
        <LinkRow href="/profile/settings" icon="⚙️" title="Settings" sub="Identity, accessibility, privacy" value={level} />
        <LinkRow href="/profile/notifications" icon="🔔" title="Notifications" sub="Inbox & reminders" />
        <LinkRow href="/profile/billing" icon="💳" title="Billing & plan" value="Family" />
        <LinkRow href="/profile/referrals" icon="🎁" title="Invite friends" sub="Earn XP when a family joins" />
        <LinkRow href="/profile/help" icon="💬" title="Help & support" last />
      </div>
      <button
        onClick={signOut}
        disabled={signingOut}
        className="mt-3 w-full bg-card border border-line rounded-card px-4 py-3 text-[13.5px] font-extrabold text-red text-left disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}
