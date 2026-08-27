/** v11/v12 club fixtures — chat-default private club, decisions journal, my performance history. */
export type ClubChatMsg =
  | { kind: "msg"; id: string; memberId: string; name: string; text: string; artifact?: { symbol: string; text: string }; mine?: boolean; readBy?: number; grad?: boolean }
  | { kind: "system"; id: string; text: string };

export const clubChat: ClubChatMsg[] = [
  { kind: "msg", id: "m1", memberId: "dad", name: "Dad", text: "Everyone see the CEG contract news? Thesis is playing out faster than I hoped 👀" },
  { kind: "msg", id: "m2", memberId: "andwele", name: "Andwele", text: "Called it 🔥 voting yes tonight", artifact: { symbol: "CEG", text: "+18% since we bought" } },
  { kind: "msg", id: "m3", memberId: "kway", name: "Kway", text: "Arielle finishes the energy lesson tonight — then it's 4/4. Full family vote 🎉", mine: true, readBy: 3 },
  { kind: "msg", id: "m4", memberId: "arielle", name: "Arielle", grad: true, text: "Done!! Quiz 10/10 ⭐ voting after dinner" },
  { kind: "system", id: "s1", text: "⭐ Arielle earned voting rights on this proposal · +20 XP" },
];

export type JournalRow = { glyph: "✓" | "✕" | "⇅"; title: string; date: string; vote: string; body: string; since?: string; sinceTone?: "good" | "bad" };
export const decisionsJournal: JournalRow[] = [
  { glyph: "✓", title: "Added CEG 4%", date: "Aug 24", vote: "4-0", body: "Believed: AI needs baseload power. Review: Nov earnings.", since: "Since: +18%", sinceTone: "good" },
  { glyph: "✕", title: "Rejected TSLA", date: "Aug 2", vote: "1-3", body: "Too volatile for our horizon.", since: "Right call so far: −9% since", sinceTone: "good" },
  { glyph: "⇅", title: "Trimmed NVDA 15→12%", date: "Jul 12", vote: "3-1", body: "Learned: concentration. All 4 took the lesson 🎓" },
];

export const performanceTiles = { vsSpPct: 2.0, positivePicksPct: 68, bestPick: { symbol: "NVDA", pct: 24 } };

export type MyPickRow = { symbol: string; stance: "BUY" | "WATCH" | "PASS"; date: string; horizon: string; sub: string; pct: number; tone: "green" | "gold" | "orange" };
export const myPerformance = {
  ytdPct: 18.2, active: 5, spPct: 6.2,
  best: { symbol: "NVDA", pct: 26.4, quote: "chips in everything AI" },
  worst: { symbol: "KO", pct: -2.1, quote: "safe dividend", note: "review?" },
  history: [
    { symbol: "NVDA", stance: "BUY", date: "Mar 14", horizon: "3y horizon", sub: "confidence ●●●○○ · ✓ verified owner", pct: 26, tone: "green" },
    { symbol: "COST", stance: "BUY", date: "Aug 20", horizon: "5y", sub: "open · club discussing", pct: 2, tone: "gold" },
    { symbol: "KO", stance: "BUY", date: "Jun 2", horizon: "resolved ✕", sub: "thesis review written · lesson linked", pct: -2.1, tone: "orange" },
  ] as MyPickRow[],
  practice: { value: 10985.4, pct: 1.15, holdings: 3, best: 12, games: 4 },
};
