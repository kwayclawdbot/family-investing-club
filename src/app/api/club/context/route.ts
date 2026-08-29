import { NextResponse } from "next/server";
import { requireSession } from "@/lib/live/route-utils";
import { chatFamilyId, getClub, getProposal } from "@/lib/live/club";
import { getCircles } from "@/lib/live/community";
import { getIdentity } from "@/lib/live/identity";
import { beltFor } from "@/lib/fixtures/belts";

/** What a sheet needs to open without server props: the member's club, open circles, and their own identity.
 *  Signed-out → 401 so sheets keep the fixture/demo path. `?proposalId=` adds that proposal for the vote sheet. */
export async function GET(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const url = new URL(req.url);
  const proposalId = url.searchParams.get("proposalId");
  const [club, circles, ident, familyId, proposal] = await Promise.all([
    getClub(), getCircles(), getIdentity(), chatFamilyId(), proposalId ? getProposal(proposalId) : Promise.resolve(null),
  ]);
  const name = ident?.name ?? r.session.profile?.display_name ?? "You";
  const belt = beltFor(ident?.lifetimeXp ?? 0);
  return NextResponse.json({
    ok: true, club, circles: circles ?? [], chatAvailable: !!familyId, proposal,
    me: { id: r.session.user.id, name, initial: ident?.initial ?? name.slice(0, 1).toUpperCase(), color: ident?.color ?? "bg-green-2", belt: belt.color, beltLabel: belt.short, lifetimeXp: ident?.lifetimeXp ?? 0 },
  });
}
