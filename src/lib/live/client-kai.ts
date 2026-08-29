"use client";

/**
 * Browser client for `/api/kai/chat` (ported in Phase 6: Anthropic + tools + a per-tier daily cap).
 * The sheet used to seed a scripted exchange and answer every message with a placeholder; this streams
 * the real reply token by token.
 */
export type KaiEvent =
  | { type: "meta"; threadId: string }
  | { type: "token"; text: string }
  | { type: "tool"; name: string }
  | { type: "block"; block: unknown }
  | { type: "done"; threadId?: string; content?: string }
  | { type: "error"; error: string };

export type KaiStream = { ok: true } | { ok: false; error: string; signedOut?: boolean };

export async function askKai(
  message: string,
  opts: { threadId?: string | null; signal?: AbortSignal; onEvent: (e: KaiEvent) => void },
): Promise<KaiStream> {
  let res: Response;
  try {
    res = await fetch("/api/kai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, threadId: opts.threadId ?? undefined }),
      signal: opts.signal,
    });
  } catch {
    return { ok: false, error: "Couldn't reach Kai — check your connection." };
  }
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => null as { error?: string } | null);
    return { ok: false, error: j?.error ?? "Kai is unavailable right now.", signedOut: res.status === 401 };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const events = buf.split("\n\n");
    buf = events.pop() ?? "";
    for (const ev of events) {
      const line = ev.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try { opts.onEvent(JSON.parse(line.slice(5).trim()) as KaiEvent); } catch { /* partial frame */ }
    }
  }
  return { ok: true };
}
