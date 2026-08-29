import { redirect } from "next/navigation";
import { Tag } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { getSession, isChild } from "@/lib/live/session";
import { userClient } from "@/lib/live/supa";
import { adminClient } from "@/lib/live/supa";
import { BillingActions } from "./BillingClient";

export const dynamic = "force-dynamic";

type Enrollment = { program: string; status: string; club_until: string | null; expires_at: string | null; created_at: string };

const PLAN_LABEL: Record<string, string> = { fta: "Family Trading Academy", fic: "Family Investing Club", free: "Free" };
const PROGRAM_LABEL: Record<string, string> = { fta: "Academy (lifetime)", fic: "Club membership", challenge_pass: "5-Day Challenge pass", free: "Free" };
const FEATURES: Record<string, string[]> = {
  fta: ["Every course, for life", "Club community, picks & watchlist", "Live classes & recordings", "Kai coach & alerts", "Family seats for your kids"],
  fic: ["All learning paths", "Club community, picks & watchlist", "Live classes & recordings", "Kai coach & alerts", "Family seats for your kids"],
  free: ["Money Basics path", "One practice portfolio", "Read-only club ideas"],
};

function fmt(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Member-facing billing (Phase 5). Reads `families.stripe_*` + `family_tiers` + `enrollments`
 * for the member's own family (RLS), and opens the Stripe Customer Portal through
 * /api/billing/portal. Children never see billing — same rule as the portal route.
 */
export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile/billing");
  if (isChild(session)) redirect("/profile");

  const familyId = session.family?.id ?? null;
  const supa = await userClient();
  let enrollments: Enrollment[] = [];
  let customerId: string | null = null;
  if (familyId) {
    const { data } = await supa
      .from("enrollments")
      .select("program, status, club_until, expires_at, created_at")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });
    enrollments = (data as Enrollment[] | null) ?? [];
    // families.stripe_customer_id is a billing identifier; like /api/billing/portal it is read
    // service-side, scoped to THIS member's own family id, and never rendered.
    const admin = adminClient();
    if (admin) {
      const { data: fam } = await admin.from("families").select("stripe_customer_id").eq("id", familyId).maybeSingle();
      customerId = ((fam as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? "").trim() || null;
    } else {
      customerId = (session.family?.stripe_customer_id ?? "").trim() || null;
    }
  }

  const tier = session.tier ?? "free";
  const lapsed = session.clubLapsed;
  const active = enrollments.filter((e) => e.status === "active");
  const primary = active.find((e) => e.program === tier) ?? active[0] ?? null;
  const planName = lapsed ? "Academy (Club paused)" : PLAN_LABEL[tier] ?? "Member";
  const features = FEATURES[lapsed ? "free" : tier] ?? FEATURES.free;
  const showJoin = tier === "free" || lapsed;
  const seats = session.family ? await seatCount(familyId) : null;

  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Billing & plan" />
      <div className="px-[18px] pb-6">
        <div className={`${tier === "free" && !lapsed ? "bg-card border-line" : "bg-green-tint border-green-line"} border rounded-card px-4 py-4`}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black text-green tracking-[0.5px]">CURRENT PLAN</div>
            <Tag tone={lapsed ? "orange" : tier === "free" ? "muted" : "green"}>{lapsed ? "CLUB PAUSED" : tier === "free" ? "FREE" : "ACTIVE"}</Tag>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-black text-ink">{planName}</span>
            {tier === "fic" && !lapsed && <span className="text-[14px] font-extrabold text-ink-3">$99/mo</span>}
          </div>
          <div className="mt-1 text-[12.5px] font-bold text-ink-2">
            {primary ? `${PROGRAM_LABEL[primary.program] ?? primary.program} · since ${fmt(primary.created_at)}` : "No membership on this family yet"}
            {primary?.club_until && !lapsed ? ` · Club until ${fmt(primary.club_until)}` : ""}
            {primary?.expires_at ? ` · expires ${fmt(primary.expires_at)}` : ""}
            {seats != null ? ` · ${seats} ${seats === 1 ? "member" : "members"}` : ""}
          </div>
          {lapsed && (
            <p className="mt-2 text-[12.5px] font-bold text-ink-2 leading-[1.5]">
              Your year of Club access with the Academy has ended. Courses stay yours for life; rejoin the Club to keep the community, picks, live classes and Kai.
            </p>
          )}
          <div className="mt-3"><BillingActions portalAvailable={customerId != null} showJoin={showJoin} /></div>
          {!customerId && !showJoin && (
            <p className="mt-2 text-[11.5px] font-bold text-ink-4">Your membership was set up before online billing. Email support@familyinvestingclub.com to change a card or cancel.</p>
          )}
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">What&apos;s included</h2>
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {features.map((f, i) => (
            <div key={f} className={`flex items-center gap-3 py-[10px] ${i < features.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-6 h-6 rounded-full bg-green-2 text-white text-[12px] font-black flex items-center justify-center">✓</span>
              <span className="text-[13.5px] font-extrabold text-ink">{f}</span>
            </div>
          ))}
        </div>

        {enrollments.length > 1 && (
          <>
            <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Membership history</h2>
            <div className="bg-card border border-line rounded-card px-4 py-1">
              {enrollments.map((e, i) => (
                <div key={`${e.program}-${e.created_at}`} className={`flex items-center justify-between py-[10px] ${i < enrollments.length - 1 ? "border-b border-paper-2" : ""}`}>
                  <div>
                    <div className="text-[13.5px] font-extrabold text-ink">{PROGRAM_LABEL[e.program] ?? e.program}</div>
                    <div className="text-[11.5px] font-bold text-ink-3">{fmt(e.created_at)}</div>
                  </div>
                  <Tag tone={e.status === "active" ? "green" : "muted"}>{e.status.toUpperCase()}</Tag>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Invoices & receipts</h2>
        {customerId ? (
          <p className="text-[13px] font-bold text-ink-2 leading-[1.55]">Receipts, card changes and cancellation live in your billing portal — tap <b className="text-ink">Manage billing</b> above.</p>
        ) : (
          <EmptyState emoji="🧾" title="No online billing yet" body="Once a Stripe checkout is on file for your family, receipts open from here." />
        )}
        <p className="mt-3 text-[11px] font-bold text-ink-4">FIC never pressures you to trade. Plans unlock learning, not risk.</p>
      </div>
    </div>
  );
}

async function seatCount(familyId: string | null): Promise<number | null> {
  if (!familyId) return null;
  try {
    const supa = await userClient();
    const { count } = await supa.from("profiles").select("id", { count: "exact", head: true }).eq("family_id", familyId);
    return count ?? null;
  } catch {
    return null;
  }
}
