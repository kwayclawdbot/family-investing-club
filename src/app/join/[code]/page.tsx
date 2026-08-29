import { redirect } from "next/navigation";
import { getSession } from "@/lib/live/session";
import { userClient } from "@/lib/live/supa";
import { JoinClient } from "./JoinClient";

type InviteDetails = { valid?: boolean; family_id?: string; family_name?: string; inviter_name?: string; role?: string; door?: string };

/**
 * /join/[code] — the household invite door. Signed out → /signup?next=/join/CODE (the invitee creates an
 * account first, then lands back here). Signed in → POST /api/family/join (FTA `redeem_invite`, falls back to
 * a club code). Invite details come from FTA's `invite_details` (anon-safe, never leaks other invites).
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).trim().toUpperCase().slice(0, 24);
  const s = await getSession();
  if (!s) redirect(`/signup?next=${encodeURIComponent(`/join/${code}`)}`);
  const supa = await userClient();
  const { data } = await supa.rpc("invite_details", { p_code: code });
  const d = (data ?? null) as InviteDetails | null;
  const invite = d?.valid ? { familyName: d.family_name ?? "a family", inviter: d.inviter_name ?? "A family member", role: (d.role === "parent" ? "parent" : "child") as "parent" | "child" } : null;
  return (
    <JoinClient
      code={code}
      invite={invite}
      me={{ name: s.profile?.display_name ?? s.user.email ?? "", familyName: s.family?.name ?? null, isChild: s.profile?.role === "child" }}
    />
  );
}
