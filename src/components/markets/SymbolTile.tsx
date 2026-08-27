import { tileTone } from "./format";
export function SymbolTile({ symbol, size = 34 }: { symbol: string; size?: number }) {
  return (
    <span
      className={`rounded-[11px] flex items-center justify-center font-black shrink-0 ${tileTone(symbol)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}
