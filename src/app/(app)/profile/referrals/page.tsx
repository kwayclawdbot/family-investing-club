import { referral } from "@/lib/data";
import { StatTile } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { ShareLink } from "@/components/profile/ShareLink";

const STEPS = [
  ["Share your link", "Send it to a family who'd love to learn together."],
  ["They join and finish onboarding", "Any plan counts — including Free."],
  ["You both earn", "XP now, badges and a free month as more families join."],
];

export default function ReferralsPage() {
  const r = referral;
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Invite friends" />
      <div className="px-[18px] pb-6">
        <ShareLink link={r.link} code={r.code} />
        <div className="mt-3 flex gap-[9px]">
          <StatTile value={r.invited} label="invited" />
          <StatTile value={r.joined} label="joined" tone="green" />
          <StatTile value={`+${r.xpEarned}`} label="XP earned" tone="orange" />
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Rewards</h2>
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {r.rewards.map((rw, i) => {
            const reached = r.joined >= rw.at;
            return (
              <div key={rw.at} className={`flex items-center gap-3 py-3 ${i < r.rewards.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black ${reached ? "bg-green-2 text-white" : "bg-paper-2 text-ink-3"}`}>{reached ? "✓" : rw.at}</span>
                <span className="flex-1">
                  <span className="block text-[13.5px] font-extrabold text-ink">{rw.label}</span>
                  <span className="block text-[11.5px] font-bold text-ink-3">{rw.at} {rw.at === 1 ? "family" : "families"} joined</span>
                </span>
                <span className={`text-[11px] font-extrabold ${reached ? "text-green" : "text-ink-4"}`}>{reached ? "Earned" : `${rw.at - r.joined} to go`}</span>
              </div>
            );
          })}
        </div>

        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">How it works</h2>
        <div className="flex flex-col gap-2">
          {STEPS.map(([t, s], i) => (
            <div key={t} className="bg-card border border-line rounded-card px-4 py-3 flex gap-3">
              <span className="w-7 h-7 rounded-[9px] bg-orange-tint text-orange-2 text-[13px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <span><span className="block text-[13.5px] font-black text-ink">{t}</span><span className="block text-[12px] font-bold text-ink-3">{s}</span></span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-bold text-ink-4">Schools and organizations can turn referrals off for their members.</p>
      </div>
    </div>
  );
}
