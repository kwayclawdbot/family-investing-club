import type { ReactNode } from "react";

/**
 * The "screen". On phones it is the viewport (height-locked so only the
 * content region scrolls and the tab bar stays put); on larger screens it is a
 * 402×874 column centred on the cream canvas so the app reads like the artboards.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh sm:h-auto sm:min-h-dvh sm:py-6 sm:flex sm:justify-center bg-canvas">
      <div className="relative w-full h-full sm:h-[874px] sm:w-[402px] sm:rounded-[40px] sm:border-[4px] sm:border-black sm:shadow-[0_18px_40px_rgba(46,42,33,0.25)] overflow-hidden bg-paper flex flex-col">
        {children}
      </div>
    </div>
  );
}

/** Scrollable content region with the artboard's 18px gutters. */
export function Content({
  children,
  className = "",
  padded = true,
}: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <main className={`flex-1 min-h-0 overflow-y-auto no-scrollbar ${padded ? "px-[18px]" : ""} pt-[env(safe-area-inset-top)] ${className}`}>
      {children}
    </main>
  );
}
