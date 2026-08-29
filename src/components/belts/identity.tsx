"use client";
import type { ReactNode } from "react";
import type { Belt } from "@/lib/types";
import { BeltChip, BeltRing } from "@/components/ui/belt";
import { cx } from "@/components/ui";
export { summariseBelts } from "@/lib/belts";
export { IdentityProvider, useIdentities, useBeltOf } from "./identity-context";

/** Avatar wrapped in the belt ring (2.5px belt colour + 2px cream offset, per canvas v8). */
export function RingedAvatar({ belt, children, className }: { belt: Belt | null; children: ReactNode; className?: string }) {
  if (!belt) return <>{children}</>;
  return <BeltRing belt={belt} className={cx("!ring-offset-[#FFFDF7] !ring-offset-2", className)}>{children}</BeltRing>;
}

/** Name + compact belt chip, inline. */
export function NameWithBelt({ name, belt, className, nameClassName }: { name: ReactNode; belt: Belt | null; className?: string; nameClassName?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-[7px] flex-wrap", className)}>
      <span className={nameClassName}>{name}</span>
      {belt && <BeltChip belt={belt} />}
    </span>
  );
}
