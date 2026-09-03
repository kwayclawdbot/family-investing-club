/**
 * Give a lesson its voice.
 *
 *   node scripts/voice-lessons.mjs scripts/content/belt-white-m1.json
 *   node scripts/voice-lessons.mjs scripts/content/belt-white-m1.json --lesson "The Four Ways to Make Money"
 *   node scripts/voice-lessons.mjs scripts/content/belt-white-m1.json --only insight-main
 *   node scripts/voice-lessons.mjs scripts/content/belt-white-m1.json --force
 *
 * Every spoken line in a lesson is authored, in the lesson file, as the `say` of an `AudioAsset` —
 * lesson-level `audio.intro` / `audio.outro`, and per step `audio.main`, `audio.wrong-<i>`,
 * `audio.reask`, `audio.explanation`, `audio.reinforce`. This renders each one to a committed MP3
 * under `public/lessons/<key>/` and writes the file's real duration back into the lesson, so the
 * app ships static assets and never synthesises anything at request time.
 *
 * It is incremental on purpose. `_voice.json` beside the MP3s stores a hash of each `say`, so
 * fixing a comma in one wrong-answer note re-renders that one clip and leaves the other twenty
 * alone — which is what makes a copy edit cheap enough to actually do.
 *
 * House voice, per standing rule: OpenAI `gpt-4o-mini-tts`, `coral` or `ash`. Per-lesson direction
 * lives in the file's `voice` block, which `install-lessons.mjs` ignores — it writes `json` only.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const MODEL = "gpt-4o-mini-tts";
const ALLOWED_VOICES = new Set(["coral", "ash"]);
const PUBLIC_ROOT = "public/lessons";

/* ── args ─────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (name) => { const i = args.indexOf(`--${name}`); return i === -1 ? null : args[i + 1]; };
const force = args.includes("--force");
const only = flag("only");
const onlyLesson = flag("lesson");
const dry = args.includes("--dry");
if (!file) { console.error("usage: voice-lessons <content.json> [--lesson TITLE] [--only CUE] [--force] [--dry]"); process.exit(2); }

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
  })
);
const KEY = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY;
if (!KEY && !dry) { console.error("no OPENAI_API_KEY in the environment or .env.local"); process.exit(1); }

/* ── the cues a lesson contains ───────────────────────────────────────── */
/** Every AudioAsset in a lesson, with the file name it must live under. One convention, no guessing. */
function cuesOf(json) {
  const out = [];
  for (const [cue, asset] of Object.entries(json.audio ?? {})) out.push({ name: cue, asset, file: `${cue}.mp3` });
  for (const step of json.steps ?? []) {
    for (const [cue, asset] of Object.entries(step.audio ?? {})) out.push({ name: `${step.id}-${cue}`, asset, file: `${step.id}-${cue}.mp3` });
  }
  return out;
}

const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

async function speak(text, voice, instructions) {
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice, input: text, instructions, response_format: "mp3" }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 300)}`);
  return Buffer.from(await r.arrayBuffer());
}

/**
 * Speech does not need 128 kbps stereo. Everything is re-encoded to 48 kbps mono, which is
 * transparent for one voice and roughly a third of the bytes — six minutes of narration lands
 * at about 2 MB instead of 5.6 MB, which matters because these are committed to the repo and
 * downloaded on a phone.
 */
function compress(buf, out) {
  const tmp = `${out}.raw.mp3`;
  fs.writeFileSync(tmp, buf);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-ac", "1", "-ar", "24000", "-b:a", "48k", out]);
  fs.unlinkSync(tmp);
  return fs.statSync(out).size;
}

/** Real duration off the encoded file — never an estimate, because the player shows it. */
function durationMs(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Math.round(parseFloat(out.trim()) * 1000);
}

/* ── run ──────────────────────────────────────────────────────────────── */
const doc = JSON.parse(fs.readFileSync(file, "utf8"));
let rendered = 0, skipped = 0, chars = 0, totalMs = 0;

for (const entry of doc.lessons) {
  if (!entry.voice) continue;
  if (onlyLesson && entry.match.title !== onlyLesson) continue;
  const { key, voice, instructions } = entry.voice;
  if (!key) { console.error(`ABORT — "${entry.match.title}" has a voice block with no key`); process.exit(1); }
  if (!ALLOWED_VOICES.has(voice)) { console.error(`ABORT — voice "${voice}" is not the house voice (coral or ash)`); process.exit(1); }

  const dir = path.join(PUBLIC_ROOT, key);
  fs.mkdirSync(dir, { recursive: true });
  const manifestPath = path.join(dir, "_voice.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { model: MODEL, voice, cues: {} };
  manifest.model = MODEL; manifest.voice = voice; manifest.cues ??= {};

  console.log(`\n${entry.match.title}  ·  ${voice} · ${MODEL} → ${dir}/`);
  for (const { name, asset, file: mp3 } of cuesOf(entry.json)) {
    const url = `/${path.posix.join("lessons", key, mp3)}`;
    // The URL is derived, never authored — a hand-typed path is a 404 waiting to happen.
    asset.url = url;
    const say = (asset.say ?? "").trim();
    if (!say) { console.log(`  skip   ${name} — no say line`); continue; }
    const h = hash(`${voice}|${instructions ?? ""}|${say}`);
    const out = path.join(dir, mp3);
    const known = manifest.cues[name];
    const fresh = known && known.hash === h && fs.existsSync(out);
    if (fresh && !force && (!only || only !== name)) {
      asset.durationMs = known.durationMs;
      totalMs += known.durationMs; skipped++;
      console.log(`  keep   ${name.padEnd(24)} ${(known.durationMs / 1000).toFixed(1)}s`);
      continue;
    }
    if (only && only !== name) { if (known) { asset.durationMs = known.durationMs; totalMs += known.durationMs; } skipped++; continue; }
    chars += say.length;
    if (dry) { console.log(`  would  ${name.padEnd(24)} ${say.length} chars`); continue; }
    const bytes = compress(await speak(say, voice, instructions), out);
    const ms = durationMs(out);
    asset.durationMs = ms;
    manifest.cues[name] = { hash: h, durationMs: ms, bytes, chars: say.length };
    totalMs += ms; rendered++;
    console.log(`  voice  ${name.padEnd(24)} ${(ms / 1000).toFixed(1)}s  ${(bytes / 1024).toFixed(0)} KB`);
  }
  if (!dry) fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (!dry) fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`\n${rendered} rendered · ${skipped} unchanged · ${chars} characters sent · ${(totalMs / 1000 / 60).toFixed(1)} min of narration`);
console.log(dry ? "(dry run — nothing written)" : `durations written back into ${file}`);
