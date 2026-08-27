import type { ReactNode } from "react";

/**
 * The "screen". On phones it is the viewport; on larger screens it is a
 * 402px column centred on the cream canvas so the app reads like the artboards.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh sm:py-6 sm:flex sm:justify-center bg-canvas">
      <div className="relative w-full min-h-dvh sm:min-h-[874px] sm:w-[402px] sm:rounded-[40px] sm:border-[4px] sm:border-black sm:shadow-[0_18px_40px_rgba(46,42,33,0.25)] sm:overflow-hidden bg-paper flex flex-col">
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
    <main className={`flex-1 overflow-y-auto no-scrollbar ${padded ? "px-[18px]" : ""} pt-[env(safe-area-inset-top)] ${className}`}>
      {children}
    </main>
  );
}
