"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

export function Reminder({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setOn(localStorage.getItem(`fic.remind.${id}`) === "1");
    } catch { /* ignore */ }
  }, [id]);
  function toggle() {
    const v = !on; setOn(v);
    try { if (v) localStorage.setItem(`fic.remind.${id}`, "1"); else localStorage.removeItem(`fic.remind.${id}`); } catch { /* ignore */ }
  }
  return <Button onClick={toggle} variant={on ? "secondary" : "primary"} full>{on ? "✓ Reminder set" : "Add reminder"}</Button>;
}
