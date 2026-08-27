export function XpPill({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-[5px] bg-orange-tint rounded-[20px] px-3 py-[6px]">
      <span className="text-[14px]">🔥</span>
      <span className="text-[13px] font-black text-orange-2">{xp.toLocaleString()} XP</span>
    </div>
  );
}
