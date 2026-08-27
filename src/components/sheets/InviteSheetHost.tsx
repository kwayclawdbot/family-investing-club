"use client";
import { useEffect, useState } from "react";
import { getClub } from "@/lib/data";
import type { Club } from "@/lib/types";
import { InviteSheet } from "@/components/club/club-shared";

/** Wraps the club's existing InviteSheet so the ＋ / any component can open it. */
export function InviteSheetHost({ onClose }: { onClose: () => void }) {
  const [club, setClub] = useState<Club | null>(null);
  useEffect(() => { getClub().then(setClub); }, []);
  if (!club) return null;
  return <InviteSheet open onClose={onClose} club={club} />;
}
