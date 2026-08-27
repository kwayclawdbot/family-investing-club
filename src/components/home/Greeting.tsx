"use client";
import { useEffect, useState } from "react";

function partOfDay(h: number) {
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** Time-of-day greeting; renders "afternoon" on the server, corrects on the client. */
export function Greeting({ name }: { name: string }) {
  const [part, setPart] = useState("afternoon");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (no SSR mismatch)
  useEffect(() => setPart(partOfDay(new Date().getHours())), []);
  return (
    <h1 className="text-[21px] font-black text-ink">
      Good {part}, {name}! 👋
    </h1>
  );
}
