/** Full-bleed surfaces (lesson, Kai, games) get the same instant paint on navigation. */
export default function Loading() {
  return (
    <div className="min-h-full px-[18px] pt-[18px] animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-[10px] w-full rounded-full bg-line-2" />
      <div className="mt-6 h-[28px] w-[70%] rounded-[10px] bg-line-2" />
      <div className="mt-3 h-[16px] w-[45%] rounded-[8px] bg-line-2/70" />
      <div className="mt-6 flex flex-col gap-[10px]">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[52px] rounded-[14px] bg-line-2/60" />)}
      </div>
    </div>
  );
}
