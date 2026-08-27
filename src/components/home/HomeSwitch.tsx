"use client";
import type { ReactNode } from "react";
import { useLevel, isYouth } from "./useLevel";

/** Child accounts (Explorer / Builder) get the protected composition; `forceChild` = `?as=child` preview. */
export function HomeSwitch({ adult, child, forceChild }: { adult: ReactNode; child: ReactNode; forceChild?: boolean }) {
  const level = useLevel();
  return <>{forceChild || isYouth(level) ? child : adult}</>;
}
