import { subscription } from "@/lib/data";
import { Tag } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { BillingActions } from "@/components/profile/BillingActions";

export default function BillingPage() {
  const s = subscription;
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Billing & plan" />
      <div className="px-[18px] pb-6">
        <div className="bg-green-tint border border-green-line rounded-card px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black text-green tracking-[0.5px]">CURRENT PLAN</div>
            <Tag tone="green">ACTIVE</Tag>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-black text-ink">{s.plan}</span>
            <span className="text-[14px] font-extrabold text-ink-3">{s.price}</span>
          </div>
          <div className="mt-1 text-[12.5px] font-bold text-ink-2">Renews {s.renews} · {s.seats.used} of {s.seats.max} seats used</div>
          <div className="mt-3"><BillingActions /></div>
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">What&apos;s included</h2>
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {s.features.map((f, i) => (
            <div key={f} className={`flex items-center gap-3 py-[10px] ${i < s.features.length - 1 ? "border-b border-paper-2" : ""}`}>
              <span className="w-6 h-6 rounded-full bg-green-2 text-white text-[12px] font-black flex items-center justify-center">✓</span>
              <span className="text-[13.5px] font-extrabold text-ink">{f}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Compare with Free</h2>
        <div className="bg-card border border-line rounded-card px-4 py-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 text-[12.5px] font-extrabold">
            <span className="text-ink-3">Feature</span><span className="text-ink-3 text-center">Free</span><span className="text-green text-center">Family</span>
            {[
              ["Money Basics path", true, true], ["All learning paths", false, true], ["Practice portfolios", "1", "Everyone"], ["Family group & streak", false, true],
              ["Club ideas & model portfolios", "Read", true], ["Live classes & recordings", false, true],
            ].map(([f, a, b]) => (
              <span key={String(f)} className="contents">
                <span className="text-ink">{f}</span>
                <span className="text-center text-ink-3">{a === true ? "✓" : a === false ? "—" : a}</span>
                <span className="text-center text-green">{b === true ? "✓" : b}</span>
              </span>
            ))}
          </div>
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Invoices</h2>
        <EmptyState emoji="🧾" title="No invoices yet" body="Receipts appear here once billing is connected." />
        <p className="mt-3 text-[11px] font-bold text-ink-4">FIC never pressures you to trade. Plans unlock learning, not risk.</p>
      </div>
    </div>
  );
}
