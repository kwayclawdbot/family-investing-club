"use client";
import { useState } from "react";
import { cx } from "@/components/ui";

export function SaveToggle({ initial = false }: { initial?: boolean }) {
  const [saved, setSaved] = useState(initial);
  return (
    <button
      aria-pressed={saved}
      aria-label={saved ? "Unsave idea" : "Save idea"}
      onClick={() => setSaved((s) => !s)}
      className={cx("font-black text-[15px] leading-none", saved ? "text-orange" : "text-ink-4")}
    >
      🔖
    </button>
  );
}

export function FollowButton() {
  const [on, setOn] = useState(false);
  return (
    <button
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={cx(
        "rounded-[11px] px-[13px] py-[5px] text-[11.5px] font-black border-[1.5px] transition",
        on ? "bg-green-2 border-green-2 text-cream-text" : "border-green-2 text-green"
      )}
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}

export function IdeaBottomBar({ comments }: { comments: number }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="sticky bottom-0 z-10 flex gap-[10px] bg-nav border-t border-line-2 px-[18px] pt-3 pb-[14px] shrink-0">
      <button className="flex-1 border-2 border-green-2 text-green rounded-[14px] py-3 text-center text-[14px] font-black active:scale-[0.98] transition">
        💬 Discuss ({comments})
      </button>
      <button
        aria-pressed={saved}
        onClick={() => setSaved((s) => !s)}
        className={cx(
          "flex-1 rounded-[14px] py-3 text-center text-[14px] font-black transition active:translate-y-[2px] active:shadow-none",
          saved ? "bg-green text-cream-text" : "bg-green-2 text-cream-text shadow-[0_3px_0_#3A6B3E]"
        )}
      >
        {saved ? "✓ Saved" : "Save Idea"}
      </button>
    </div>
  );
}
