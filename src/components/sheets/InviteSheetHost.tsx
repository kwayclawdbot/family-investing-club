"use client";
import { useEffect, useState } from "react";
import { getClub } from "@/lib/data";
import type { Club } from "@/lib/types";
import { InviteSheet } from "@/components/club/club-shared";
import { clubApi } from "@/lib/live/client-club";

/** Wraps the club's existing InviteSheet so the ＋ / any component can open it. Live club when signed in; fixture when signed out. */
export function InviteSheetHost({ onClose }: { onClose: () => void }) {
  const [club, setClub] = useState<Club | null>(null);
  useEffect(() => {
    let alive = true;
    clubApi.context().then(async (ctx) => { const c = ctx.ok && ctx.club ? ctx.club : await getClub(); if (alive) setClub(c); });
    return () => { alive = false; };
  }, []);
  if (!club) return null;
  return <InviteSheet open onClose={onClose} club={club} />;
}
