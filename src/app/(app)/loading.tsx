/**
 * Instant feedback on navigation.
 *
 * Member pages render market data on the server, and a cold Polygon cache can hold a render for a
 * few seconds. Without a loading state Next shows the *previous* page until the new one is ready,
 * so a tap reads as "nothing happened". This skeleton paints immediately instead.
 */
export default function Loading() {
  return (
    <div className="pt-[14px] pb-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-[26px] w-[42%] rounded-[9px] bg-line-2" />
      <div className="mt-3 h-[62px] rounded-[16px] bg-line-2/70" />
      <div className="mt-2 flex gap-2">
        <div className="h-[86px] flex-1 rounded-[16px] bg-line-2/70" />
        <div className="h-[86px] flex-1 rounded-[16px] bg-line-2/70" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[58px] rounded-[15px] bg-line-2/60" />)}
      </div>
    </div>
  );
}
