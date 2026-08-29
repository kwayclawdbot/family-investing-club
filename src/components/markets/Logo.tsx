"use client";
import { useState } from "react";
import { brandOf } from "@/lib/content/brands";

/**
 * A company's real mark, over its brand-coloured ticker square.
 *
 * The image is proxied by `/api/market/logo/[symbol]` (Polygon's branding URLs carry the API key, so
 * they can never reach a browser). Symbols Polygon has no logo for — most ETFs — fail the load and
 * the square underneath is what shows. It has to be `onError`, not CSS: a broken <img> that still
 * has a box paints its own background over the square.
 */
export function Logo({ symbol, size = 30, radius = 9 }: { symbol: string; size?: number; radius?: number }) {
  const [failed, setFailed] = useState(false);
  const sym = symbol.toUpperCase();
  const fs = size >= 34 ? 8.5 : size >= 28 ? 8 : size >= 24 ? 6.5 : 6;
  return (
    <span
      className="relative inline-flex items-center justify-center text-white font-black shrink-0 overflow-hidden shadow-[0_2px_5px_rgba(46,42,33,0.25)]"
      style={{ width: size, height: size, borderRadius: radius, background: brandOf(sym), fontSize: fs, letterSpacing: -0.3 }}
      title={sym}
    >
      {sym.slice(0, 4)}
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element -- served by our own route; no loader needed
        <img
          src={`/api/market/logo/${sym}`}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full bg-white object-contain"
        />
      )}
    </span>
  );
}
