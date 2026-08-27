import Link from "next/link";
import type { ClubConsensus, FicConsensus, ClubMember } from "@/lib/types";
import { MemberAvatar } from "@/components/club/club-shared";

/**
 * Consensus layer (canvas v7, artboard 02). Consensus is what members think —
 * opinions, not advice or a recommendation. Badge language: "Verified Owners ✓" only.
 */
const fmt = (n: number) => n.toLocaleString("en-US");

function StanceBar({ emoji, label, count, total, color }: { emoji: string; label: string; count: number; total: number; color: string }) {
  const w = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-[9px] mt-[6px]">
      <span className="w-[14px] text-[12px]" aria-hidden>{emoji}</span>
      <span className="w-[44px] text-[11.5px] font-extrabold text-[#4A4436]">{label}</span>
      <div className="flex-1 h-[12px] rounded-[6px] bg-line-2 overflow-hidden" role="meter" aria-valuenow={count} aria-valuemin={0} aria-valuemax={total} aria-label={`${label} ${count}`}>
        <div className={`h-full rounded-[6px] ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="w-[16px] text-right text-[11.5px] font-black text-ink">{count}</span>
    </div>
  );
}

export function ClubConsensusCard({ c, clubName, symbol, voters }: { c: ClubConsensus; clubName: string; symbol: string; voters: Pick<ClubMember, "initial" | "color" | "id">[] }) {
  const total = c.buy + c.watch + c.pass;
  const exposureWarn = c.verifiedExposurePct != null && c.modelTargetPct != null && c.verifiedExposurePct > c.modelTargetPct;
  const whyParts = c.why.split(c.thesis);
  return (
    <>
      <section className="mt-3 rounded-[18px] border-2 border-green-2 bg-card px-4 py-[14px]" aria-label="Club consensus">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-black text-green">🏠 CLUB CONSENSUS · {clubName.toUpperCase()}</span>
          <span className="rounded-[8px] bg-green-tint px-[9px] py-[3px] text-[10px] font-black text-green">CONFIDENCE {c.confidencePct}%</span>
        </div>
        <StanceBar emoji="🟢" label="Buy" count={c.buy} total={total} color="bg-green-2" />
        <StanceBar emoji="🟡" label="Watch" count={c.watch} total={total} color="bg-gold" />
        <StanceBar emoji="🔴" label="Pass" count={c.pass} total={total} color="bg-red" />
        <div className="mt-[11px] flex gap-2">
          <div className="flex-1 rounded-[11px] border border-line bg-paper px-[11px] py-2 text-center">
            <div className="text-[14px] font-black text-ink">{c.verifiedOwners} ✓</div>
            <div className="text-[9px] font-extrabold text-ink-3">VERIFIED OWNERS</div>
          </div>
          <div className="flex-1 rounded-[11px] border border-line bg-paper px-[11px] py-2 text-center">
            <div className="text-[14px] font-black text-ink">{c.modelTargetPct != null ? `${c.modelTargetPct}%` : "—"}</div>
            <div className="text-[9px] font-extrabold text-ink-3">MODEL TARGET</div>
          </div>
          <div className={`flex-1 rounded-[11px] border bg-paper px-[11px] py-2 text-center ${exposureWarn ? "border-orange-line" : "border-line"}`}>
            <div className={`text-[14px] font-black ${exposureWarn ? "text-orange-2" : "text-ink"}`}>{c.verifiedExposurePct != null ? `${c.verifiedExposurePct}%${exposureWarn ? " ⚠" : ""}` : "—"}</div>
            <div className="text-[9px] font-extrabold text-ink-3">VERIFIED EXPOSURE</div>
          </div>
        </div>
      </section>

      <section className="mt-[10px] rounded-card border border-line bg-card px-4 py-[13px]">
        <div className="text-[11.5px] font-black text-orange">WHY YOUR CLUB LIKES {symbol}</div>
        <p className="mt-[7px] text-[12.5px] font-semibold text-[#4A4436] leading-[1.55]">
          {whyParts.length > 1 ? (<>{whyParts[0]}<b className="font-black">{c.thesis}</b>{whyParts.slice(1).join(c.thesis)}</>) : c.why}
        </p>
        <div className="mt-[9px] flex items-center gap-[6px]">
          {voters.map((v) => <MemberAvatar key={v.id} m={v} size={22} />)}
          <Link href="/club?tab=feed&filter=picks" className="ml-1 text-[10.5px] font-extrabold text-purple-2">Read all {c.totalPicks} picks →</Link>
        </div>
      </section>
    </>
  );
}

export function NoClubConsensus({ symbol }: { symbol: string }) {
  return (
    <Link href={`/club/pick/new?symbol=${symbol}`} className="mt-3 flex items-center justify-between rounded-[14px] border border-line bg-card px-[15px] py-[11px]">
      <span className="text-[12px] font-extrabold text-ink-2">🏠 No club picks on {symbol} yet — make the first one</span>
      <span className="text-[11px] font-black text-green">›</span>
    </Link>
  );
}

export function FicConsensusCard({ f }: { f: FicConsensus }) {
  return (
    <section className="mt-[10px] rounded-card border border-line bg-card px-4 py-[13px]" aria-label="FIC network consensus">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-black text-purple-2">🌍 FIC CONSENSUS · NETWORK-WIDE</span>
        <span className="text-[10.5px] font-extrabold text-ink-3">{fmt(f.picks)} picks</span>
      </div>
      <div className="mt-[9px] flex h-[14px] rounded-[7px] overflow-hidden" role="img" aria-label={`${f.buyPct}% buy, ${f.watchPct}% watch, ${f.passPct}% pass`}>
        <span className="bg-green-2" style={{ width: `${f.buyPct}%` }} />
        <span className="bg-gold" style={{ width: `${f.watchPct}%` }} />
        <span className="bg-red" style={{ width: `${f.passPct}%` }} />
      </div>
      <div className="mt-[6px] flex justify-between text-[10.5px] font-extrabold text-ink-2">
        <span>🟢 {f.buyPct}% Buy</span><span>🟡 {f.watchPct}% Watch</span><span>🔴 {f.passPct}% Pass</span>
      </div>
      <div className="mt-2 text-[11px] font-extrabold text-ink-3">{fmt(f.verifiedOwners)} Verified Owners ✓ across the network</div>
    </section>
  );
}

export function ConsensusActions({ symbol }: { symbol: string }) {
  return (
    <>
      <div className="mt-[10px] flex gap-2">
        <Link href={`/club/pick/new?symbol=${symbol}`} className="flex-1 rounded-[13px] bg-orange py-[11px] text-center text-[12px] font-black text-cream-text shadow-[0_2px_0_#C96D25] active:translate-y-[1px] active:shadow-none">Make a Pick</Link>
        <a href="#dossier" className="flex-1 rounded-[13px] border-[1.5px] border-green-2 bg-card py-[11px] text-center text-[12px] font-black text-green">View dossier</a>
      </div>
      <p className="mt-[9px] text-center text-[10px] font-bold text-ink-4">Consensus is what members think — opinions, not advice or a recommendation</p>
    </>
  );
}
