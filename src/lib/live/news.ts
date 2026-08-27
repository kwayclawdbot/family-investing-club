import "server-only";
import type { NewsItem } from "@/lib/types";
import { ago, must, safe, userClient } from "./supa";

type Row = { id: string; slug: string; kind: string | null; title: string; dek: string | null; sections: { heading?: string; body?: string; text?: string }[] | Record<string, unknown> | null; tickers: string[] | null; published: boolean; generated_at: string | null; created_at: string };

function sectionsOf(r: Row): { heading?: string; body?: string }[] {
  const s = r.sections;
  if (Array.isArray(s)) return s.map((x) => ({ heading: x.heading, body: x.body ?? x.text }));
  return [];
}
function toItem(r: Row): NewsItem {
  const secs = sectionsOf(r);
  const why = secs.find((s) => /why|matter/i.test(s.heading ?? ""))?.body ?? secs[0]?.body ?? r.dek ?? "";
  return { id: r.slug, headline: r.title, source: r.kind ?? "FIC newsroom", ago: ago(r.generated_at ?? r.created_at) + " ago", symbols: r.tickers ?? [], whyItMatters: why, concepts: [], body: secs.map((s) => s.body).filter(Boolean).join("\n\n") || r.dek || "" };
}

export async function getNews(): Promise<NewsItem[] | null> {
  return safe("news.getNews", async () => {
    const supa = await userClient();
    const rows = must(await supa.from("news_articles").select("*").eq("published", true).order("created_at", { ascending: false }).limit(20)) as Row[];
    if (!rows.length) return null;
    return rows.map(toItem);
  });
}

export async function getNewsItem(id: string): Promise<NewsItem | null> {
  return safe("news.getNewsItem", async () => {
    const supa = await userClient();
    const row = must(await supa.from("news_articles").select("*").eq("slug", id).maybeSingle()) as Row | null;
    return row ? toItem(row) : null;
  });
}
