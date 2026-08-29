import { Fragment, type ReactNode } from "react";

/** Bold / italic / `code` inside one line. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i}`} className="font-black">{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={`${key}-${i}`} className="bg-paper-2 rounded-[5px] px-[4px] py-[1px] text-[12px]">{t.slice(1, -1)}</code>);
    else out.push(<em key={`${key}-${i}`}>{t.slice(1, -1)}</em>);
    last = i + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Kai answers in markdown. This renders the small subset the model actually uses — headings, bullets,
 * numbered steps, quotes, bold — rather than showing the raw asterisks. No dependency, no HTML.
 */
export function Rich({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        const key = `l${i}`;
        if (!line.trim()) return <span key={key} className="block h-[6px]" />;
        const heading = /^#{1,6}\s+(.*)$/.exec(line);
        if (heading) return <span key={key} className="block text-[13.5px] font-black text-ink mt-[6px] first:mt-0">{inline(heading[1], key)}</span>;
        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        if (bullet) return <span key={key} className="flex gap-[7px] mt-[2px]"><span className="text-ink-4">•</span><span className="flex-1">{inline(bullet[1], key)}</span></span>;
        const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
        if (numbered) return <span key={key} className="flex gap-[7px] mt-[2px]"><span className="text-ink-4 font-black">{numbered[1]}.</span><span className="flex-1">{inline(numbered[2], key)}</span></span>;
        const quote = /^>\s?(.*)$/.exec(line);
        if (quote) return <span key={key} className="block border-l-2 border-purple-line pl-[9px] my-[4px] text-ink-2 italic">{inline(quote[1], key)}</span>;
        return <Fragment key={key}><span className="block">{inline(line, key)}</span></Fragment>;
      })}
    </>
  );
}
