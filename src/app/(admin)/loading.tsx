/** Admin tables are large reads; paint the frame immediately rather than hanging on the old page. */
export default function Loading() {
  return (
    <div className="p-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-[24px] w-[220px] rounded-[8px] bg-line-2" />
      <div className="mt-4 flex flex-col gap-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[44px] rounded-[10px] bg-line-2/60" />)}</div>
    </div>
  );
}
