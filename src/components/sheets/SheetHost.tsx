"use client";
import { closeSheet, useSheet } from "./bus";
import { PickSheet } from "./PickSheet";
import { AskClubSheet } from "./AskClubSheet";
import { VoteSheet } from "./VoteSheet";
import { InviteSheetHost } from "./InviteSheetHost";
import { AskKaiSheet } from "./AskKaiSheet";
import { ComposeSheet } from "./ComposeSheet";
export { openSheet, openVoteSheet, closeSheet } from "./bus";

/** Mounted once (from PlusFab). Renders whichever sheet the bus says is open. */
export function SheetHost() {
  const s = useSheet();
  if (!s) return null;
  const p = (s.payload ?? {}) as Record<string, string | undefined>;
  switch (s.kind) {
    case "pick": return <PickSheet onClose={closeSheet} symbol={p.symbol} />;
    case "ask": return <AskClubSheet onClose={closeSheet} />;
    case "vote": return p.proposalId ? <VoteSheet proposalId={p.proposalId} onClose={closeSheet} /> : null;
    case "invite": return <InviteSheetHost onClose={closeSheet} />;
    case "kai": return <AskKaiSheet onClose={closeSheet} context={p.context} />;
    case "compose": return <ComposeSheet onClose={closeSheet} audience={p.audience} reply={p.reply} replyTo={p.replyTo} />;
  }
}
