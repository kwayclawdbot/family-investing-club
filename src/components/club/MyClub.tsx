"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Club, ClubActivity, ClubMember, ClubPortfolio, ClubProposal, Pick, ResearchAssignment } from "@/lib/types";
import { cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { ChevronRight } from "@/components/ui/icons";
import { AvatarStack, ClubToggle, InviteSheet, MemberAvatar, StanceTag, TickerTile, dots, useStoredClub } from "./club-shared";
import { NewClubEmpty, splitName } from "./NewClubEmpty";
import { useStored } from "./storage";

export type ClubTab = "Feed" | "Research" | "Portfolio" | "Members";
const TABS: ClubTab[] = ["Feed", "Research", "Portfolio", "Members"];
const FILTERS = ["All", "Picks", "Ideas", "Votes"] as const;
type Filter = (typeof FILTERS)[number];

type Props = {
  club: Club; visible: ClubMember[]; picks: Pick[]; proposals: ClubProposal[]; research: ResearchAssignment[]; activity: ClubActivity[];
  portfolio: ClubPortfolio; initialTab?: ClubTab; forceNew?: boolean;
};

/** Artboard 05 (canonical) + 11 — My Club: identity, toggle, 4 tabs, picks in feed, pick FAB. */
export function MyClub({ club, visible, picks, proposals, research, activity, portfolio, initialTab = "Feed", forceNew }: Props) {
  const router = useRouter();
  const [stored] = useStoredClub();
  const [isNew] = useStored<string>("fic.club.new", "");
  const [tab, setTab] = useState<ClubTab>(initialTab);
  const [filter, setFilter] = useState<Filter>("All");
  const [invite, setInvite] = useState(false);
  const [localPicks] = useStored<Pick[]>("fic.picks", []);
  const [localProposals] = useStored<ClubProposal[]>("fic.proposals", []);
  const [rsvp, setRsvp] = useStored<boolean>("fic.rsvp", false);
  const name = stored.name ?? club.name;

  if (forceNew || isNew === "1") return <NewClubEmpty club={club} name={name} />;

  const open = [...localProposals, ...proposals].filter((p) => p.status === "open");
  const allPicks = [...localPicks, ...picks];
  const [line1, line2] = splitName(name);
  const privacy = stored.privacy ?? club.privacy;

  function switchTab(t: ClubTab) {
    setTab(t);
    router.replace(t === "Research" ? "/club/research" : t === "Members" ? "/club/members" : "/club", { scroll: false });
  }

  return (
    <>
      {/* identity header */}
      <div className="mt-[14px] bg-card border border-line rounded-[18px] px-4 py-[15px]">
        <div className="flex items-center gap-[13px]">
          <span className="w-[54px] h-[54px] rounded-[17px] bg-green-2 text-cream-text font-black text-[21px] flex items-center justify-center shrink-0">{name.trim().charAt(0).toUpperCase()}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[17.5px] font-black text-ink leading-[1.2]">{line1}{line2 && <><br />{line2}</>}</div>
            <div className="text-[11px] font-extrabold text-ink-3 mt-[3px]">{privacy === "private" ? "🔒 Private" : "🌍 Public"} · {visible.length} members · est. {club.est}</div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <AvatarStack members={visible} />
          <button onClick={() => setInvite(true)} className="bg-green-2 text-cream-text rounded-[13px] px-5 py-[10px] text-[13.5px] font-black shadow-[0_3px_0_#3A6B3E] active:translate-y-[2px] active:shadow-none transition">+ Invite</button>
        </div>
      </div>
      <ClubToggle active="club" />

      {/* tabs */}
      <div className="flex gap-5 mt-3 border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => switchTab(t)} className={cx("pb-[7px] text-[13.5px] border-b-[3px] -mb-px transition", tab === t ? "font-black text-ink border-purple" : "font-extrabold text-ink-4 border-transparent")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Feed" && (
        <>
          <div className="flex gap-[7px] mt-[10px]" role="tablist" aria-label="Filter">
            {FILTERS.map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cx("rounded-[16px] px-[13px] py-[5px] text-[11px] transition", filter === f ? "bg-ink text-cream-text font-black" : "bg-card border border-line text-ink-3 font-extrabold")}>
                {f}
              </button>
            ))}
          </div>

          {(filter === "All" || filter === "Votes") && open.map((p) => (
            <div key={p.id} className="mt-[10px] bg-purple-tint border border-[#DDD4F0] rounded-[14px] px-[14px] py-[11px] flex items-center gap-[10px]">
              <span className="text-[16px]" aria-hidden>🗳</span>
              <div className="flex-1 text-[12.5px] font-black text-ink">{proposalTitle(p)} · {tally(p)} voted · {p.endsIn} left</div>
              <Link href={`/club/vote/${p.id}`} className="bg-purple text-cream-text rounded-[10px] px-3 py-[6px] text-[10.5px] font-black">Vote</Link>
            </div>
          ))}

          {(filter === "All" || filter === "Picks" || filter === "Ideas") && (
            <div className="mt-[9px] bg-card border border-line rounded-[16px] px-[15px] py-1">
              {(filter !== "Ideas" ? allPicks : []).map((pk, i, arr) => (
                <Link key={pk.id} href={`/club/pick/${pk.id}`} className={cx("flex gap-[10px] py-[11px]", (i < arr.length - 1 || filter === "All") && "border-b border-paper-2")}>
                  <MemberAvatar m={avatarFor(club, pk.authorId, pk.author)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-[#4A4436]"><b className="font-black">{pk.author}</b> · Pick · {pk.ago}</div>
                    <div className="mt-[5px] bg-paper border border-line rounded-[11px] px-[11px] py-2 flex items-center gap-2">
                      <StanceTag symbol={pk.symbol} stance={pk.stance} />
                      <span className="text-[11.5px] font-bold text-ink-2 truncate">&quot;{shortQuote(pk.reason)}&quot; · {pk.horizon} · {dots(pk.confidence)}</span>
                    </div>
                    <div className="mt-[5px] text-[10.5px] font-extrabold text-ink-3">❤️ {pk.agree + 1} · 💬 {pk.replies.length} {pk.replies.length === 1 ? "reply" : "replies"}</div>
                  </div>
                </Link>
              ))}
              {filter !== "Picks" && activity.filter((a) => a.kind === "research").slice(0, 1).map((a) => (
                <div key={a.id} className="flex gap-[10px] py-[11px]">
                  <MemberAvatar m={avatarFor(club, a.actorId, a.actor)} />
                  <div className="flex-1">
                    <div className="text-[12.5px] font-bold text-[#4A4436]"><b className="font-black">{a.actor}</b> finished <b className="font-black">Costco</b> research · {a.ago}</div>
                    {a.quote && <div className="mt-1 text-[11.5px] font-bold text-ink-2">&quot;{a.quote}&quot;</div>}
                    <Link href="/club/new?from=research" className="mt-1 inline-block text-[10.5px] font-extrabold text-purple-2">Turn into an Idea →</Link>
                  </div>
                </div>
              ))}
              {filter === "Picks" && allPicks.length === 0 && <div className="py-6 text-center text-[12.5px] font-bold text-ink-3">No picks yet — make the first one.</div>}
              {filter === "Ideas" && <Link href="/club/idea/nuclear-next-decade" className="block py-[11px] text-[12.5px] font-extrabold text-ink">🔥 Following: Nuclear Energy — The Next Decade <span className="text-ink-3 font-bold">· Sarah J. · public idea</span></Link>}
            </div>
          )}

          {filter === "All" && (
            <>
              <div className="mt-[9px] bg-orange-tint border border-orange-line rounded-[14px] px-[14px] py-[10px] flex items-center gap-[10px]">
                <span className="text-[16px]" aria-hidden>📅</span>
                <span className="flex-1 text-[11.5px] font-extrabold text-orange-2">Family Investing Night — {club.investingNight.when} · {club.investingNight.topic}</span>
                <button onClick={() => setRsvp(!rsvp)} aria-pressed={rsvp} className="text-[10.5px] font-black text-orange-2">{rsvp ? "Going ✓" : "RSVP ›"}</button>
              </div>
              <div className="mt-[9px] mb-24 text-center text-[11px] font-bold text-ink-4">🔥 Club streak: {club.streakWeeks} weeks of activity — light touch, no pressure</div>
            </>
          )}
          {filter !== "All" && <div className="mb-24" />}
        </>
      )}

      {tab === "Research" && <ResearchList research={research} club={club} />}

      {tab === "Portfolio" && (
        <Link href="/club/portfolio" className="mt-3 mb-24 block bg-card border border-line rounded-[16px] px-4 py-[13px]">
          <div className="flex items-center justify-between">
            <span className="bg-green-tint text-green rounded-[20px] px-[13px] py-[5px] text-[11px] font-black">PRACTICE · SIMULATED</span>
            <ChevronRight className="text-ink-4" />
          </div>
          <div className="mt-2 text-[17px] font-black text-ink">{portfolio.name}</div>
          <div className="text-[11.5px] font-bold text-ink-3">No pooled money — decisions are real, dollars are practice</div>
          <div className="flex gap-[9px] mt-3">
            <div className="flex-1 bg-paper border border-line rounded-[14px] px-[13px] py-[11px]">
              <div className="text-[10px] font-extrabold text-ink-3">VALUE · YTD</div>
              <div className="text-[18px] font-black text-ink">${Math.round(portfolio.value).toLocaleString()} <span className="text-[12px] text-green-2">+{portfolio.ytdPct}%</span></div>
            </div>
            <div className="flex-1 bg-paper border border-line rounded-[14px] px-[13px] py-[11px]">
              <div className="text-[10px] font-extrabold text-ink-3">HOLDINGS</div>
              <div className="text-[18px] font-black text-ink">{portfolio.holdings.length} <span className="text-[11px] font-extrabold text-ink-3">each links to its proposal</span></div>
            </div>
          </div>
          {open[0] && <div className="mt-3 text-[11.5px] font-extrabold text-purple-2">🗳 Open: {proposalTitle(open[0])} · {tally(open[0])} voted →</div>}
        </Link>
      )}

      {tab === "Members" && <MembersList club={club} onInvite={() => setInvite(true)} />}

      {/* pick FAB */}
      <Link href="/club/pick/new" className="absolute right-[18px] bottom-[126px] z-40 flex items-center gap-2 bg-orange text-cream-text rounded-[28px] px-[19px] py-[13px] shadow-[0_6px_16px_rgba(201,109,37,0.4)] active:scale-95 transition">
        <span className="text-[17px] font-black leading-none">＋</span>
        <span className="text-[14px] font-black">Make a Pick</span>
      </Link>
      <InviteSheet open={invite} onClose={() => setInvite(false)} club={club} />
    </>
  );
}

/* ── Research tab — collaborative list with reasons + assignees ────── */
export function ResearchList({ research, club }: { research: ResearchAssignment[]; club: Club }) {
  const [overrides, setOverrides] = useStored<Record<string, Partial<ResearchAssignment>>>("fic.research", {});
  const [assign, setAssign] = useState<ResearchAssignment | null>(null);
  const items = useMemo(() => research.map((r) => ({ ...r, ...overrides[r.id] })), [research, overrides]);
  const openItems = items.filter((r) => r.status === "open");
  const doneItems = items.filter((r) => r.status === "done");
  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] font-black text-ink-3">RESEARCHING TOGETHER · {openItems.length} OPEN</div>
        <Link href="/search" className="text-[11px] font-black text-green">+ Add a company</Link>
      </div>
      <div className="mt-2 bg-card border border-line rounded-[16px] px-[15px] py-1">
        {openItems.map((r, i) => (
          <div key={r.id} className={cx("flex items-center gap-[10px] py-[10px]", i < openItems.length - 1 && "border-b border-paper-2")}>
            <TickerTile symbol={r.symbol} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-extrabold text-ink">{r.name} <span className="text-ink-3 font-bold">· {r.assignee === "you" ? "you" : r.assignee}</span></div>
              <div className="text-[10.5px] font-bold text-ink-3 truncate">&quot;{r.reason}&quot; · due {r.due}</div>
            </div>
            {r.assignee === "you" ? (
              <Link href={`/discover/${r.symbol}`} className="text-[10.5px] font-black text-green whitespace-nowrap">Research ›</Link>
            ) : (
              <button onClick={() => setAssign(r)} className="text-[10.5px] font-black text-purple-2 whitespace-nowrap">Assign</button>
            )}
          </div>
        ))}
        {openItems.length === 0 && <div className="py-6 text-center text-[12.5px] font-bold text-ink-3">Nothing open — add a company you all know.</div>}
      </div>
      {doneItems.length > 0 && (
        <>
          <div className="mt-4 text-[11px] font-black text-ink-3">DONE · NOTES</div>
          <div className="mt-2 bg-card border border-line rounded-[16px] px-[15px] py-1">
            {doneItems.map((r, i) => (
              <div key={r.id} className={cx("py-[10px]", i < doneItems.length - 1 && "border-b border-paper-2")}>
                <div className="flex items-center gap-[10px]">
                  <TickerTile symbol={r.symbol} />
                  <div className="flex-1 text-[12.5px] font-extrabold text-ink">{r.name} <span className="text-ink-3 font-bold">· {r.assignee} · done</span></div>
                  <span className="text-green-2 font-black">✓</span>
                </div>
                {r.notes && <div className="mt-[6px] ml-[42px] text-[11.5px] font-bold text-ink-2">&quot;{r.notes}&quot;</div>}
                <Link href="/club/new?from=research" className="ml-[42px] mt-1 inline-block text-[10.5px] font-extrabold text-purple-2">Turn into an Idea →</Link>
              </div>
            ))}
          </div>
        </>
      )}
      <Sheet open={!!assign} onClose={() => setAssign(null)} title={assign ? `Who researches ${assign.symbol}?` : ""}>
        <div className="flex flex-col gap-2">
          {club.members.filter((m) => m.id !== "dad").map((m) => (
            <button key={m.id} onClick={() => { if (assign) setOverrides({ ...overrides, [assign.id]: { assigneeId: m.id, assignee: m.isYou ? "you" : m.name } }); setAssign(null); }} className="flex items-center gap-3 bg-paper border border-line rounded-[12px] px-3 py-[10px] text-left">
              <MemberAvatar m={m} size={28} />
              <span className="flex-1 text-[13px] font-extrabold text-ink">{m.isYou ? "Me — I volunteer" : m.name}</span>
              <ChevronRight className="text-ink-4" />
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/* ── Members tab ───────────────────────────────────────────────────── */
const roleLabel: Record<ClubMember["role"], { text: string; cls: string }> = {
  founder: { text: "Founder", cls: "bg-green-tint text-green" },
  admin: { text: "Admin", cls: "bg-orange-tint text-orange-2" },
  member: { text: "Member", cls: "bg-paper-2 text-ink-3" },
  child: { text: "Child", cls: "bg-purple-tint text-purple-2" },
};
export function MembersList({ club, onInvite }: { club: Club; onInvite: () => void }) {
  const members = club.members.filter((m) => m.id !== "dad");
  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] font-black text-ink-3">{members.length} MEMBERS · {club.rules.votes.toUpperCase()} VOTES{club.rules.kidsCanVote ? " · KIDS CAN VOTE" : ""}</div>
        <button onClick={onInvite} className="text-[11px] font-black text-green">+ Invite</button>
      </div>
      <div className="mt-2 bg-card border border-line rounded-[16px] px-[15px] py-1">
        {members.map((m, i) => (
          <div key={m.id} className={cx("flex items-center gap-[11px] py-[10px]", i < members.length - 1 && "border-b border-paper-2")}>
            <MemberAvatar m={m} size={34} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[6px]">
                <span className="text-[13px] font-black text-ink">{m.name}{m.isYou ? " (you)" : ""}</span>
                <span className={cx("rounded-[6px] px-[7px] py-[2px] text-[9.5px] font-black", roleLabel[m.role].cls)}>{roleLabel[m.role].text}</span>
              </div>
              <div className="text-[10.5px] font-bold text-ink-3">{m.level} level{m.voteGated ? ` · 🎓 ${m.gateReason}` : ""}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] font-bold text-ink-4">Roles come from the household: guardians manage kids&apos; settings in Family.</p>
    </div>
  );
}

/* helpers */
export function proposalTitle(p: ClubProposal) {
  const delta = p.toWeightPct - p.fromWeightPct;
  if (p.kind === "remove") return `Remove ${p.symbol}`;
  if (p.kind === "add" && p.fromWeightPct === 0) return `Add ${p.symbol} ${p.toWeightPct}%`;
  return `${delta >= 0 ? "Add" : "Trim"} ${p.symbol} ${delta >= 0 ? "+" : ""}${delta}%`;
}
export function tally(p: ClubProposal) {
  const cast = p.votes.filter((v) => v.vote).length;
  return `${cast}/${p.votes.filter((v) => v.memberId !== "dad").length}`;
}
export function avatarFor(club: Club, id: string, name: string) {
  return club.members.find((m) => m.id === id) ?? { initial: name.charAt(0).toUpperCase(), color: "bg-purple" };
}
export function shortQuote(s: string, max = 34) {
  const t = s.replace(/\.$/, "");
  const lower = t.charAt(0).toLowerCase() + t.slice(1);
  return lower.length > max ? lower.slice(0, max - 1).trimEnd() + "…" : lower;
}
