"use client";
import type { Club, ResearchAssignment } from "@/lib/types";
import { ScreenHeader } from "../club-shared";
import { ResearchList } from "../MyClub";

/** Collaborative research list — reached from Overview's "All research ›". */
export function ResearchPage({ club, research }: { club: Club; research: ResearchAssignment[] }) {
  return (
    <>
      <ScreenHeader backHref="/club" title="Research" />
      <div className="text-[10.5px] font-extrabold text-ink-3 mt-1">Who&apos;s researching what · every item ties back to the company page and the club&apos;s decisions</div>
      <ResearchList research={research} club={club} />
    </>
  );
}
