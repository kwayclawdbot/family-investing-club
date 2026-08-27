"use client";
import { SearchIcon, BellIcon } from "@/components/ui/icons";

export function SearchField({
  value,
  onChange,
  placeholder = "Search companies, ETFs, concepts…",
  bell = true,
  autoFocus,
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  bell?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center gap-[10px]">
      <label className="flex-1 flex items-center gap-[9px] bg-card border border-line rounded-[14px] px-[14px] py-[10px]">
        <SearchIcon size={15} className="text-ink-4 shrink-0" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search markets"
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] font-bold text-ink placeholder:text-ink-4"
        />
      </label>
      {bell && (
        <span className="w-[38px] h-[38px] rounded-full bg-card border border-line flex items-center justify-center text-ink-2 shrink-0">
          <BellIcon size={16} />
        </span>
      )}
    </div>
  );
}
