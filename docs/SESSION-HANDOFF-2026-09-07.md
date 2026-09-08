# Session handoff — 2026-09-07

FIC is being rebuilt as a React Native app. This document is what happened; the app itself is at
`apps/mobile` on branch **`mobile/rn-gluestack`**.

**One-line state:** the RN app is built and runs — a Duolingo-style path, a weekly picks screen with
three lanes, and the club — against the real database on the owner's own account. It is **not
deployed anywhere**: no EAS build, no TestFlight, no hosted URL. Nothing was pushed to the
production database. The web app's `CompareStep` card grid was also fixed on the way through.

Read `docs/BELT-CURRICULUM.md` for the curriculum plan of record and
`docs/SESSION-HANDOFF-2026-09-03.md` for how the belts got built.

---

## 1. What was asked

Three requests, in order, each narrowing the last:

1. Fix the four-ways screen, which came back as a 2×2 card grid against the standing rule.
2. "Overhaul our LMS using gluestack skill."
3. **"I want the family investing club to become a react native app built on gluestack"** — scoped
   to *"community learning with duolingo style lms and also weekly stock picks from our kai brain +
   admin + community picks thats it."*

The third is the brief. It is **not** a port of the existing 95 screens.

---

## 2. Where things stand

### Branch `mobile/rn-gluestack`, three commits

| Commit | What |
|---|---|
| `a45b158` | The app: three surfaces, the palette bridge, the lesson player. Plus the web `CompareStep` fix. |
| `e60c11e` | NativeWind removed entirely — it loaded on device and killed the tree. |
| `f5608e7` | `SafeAreaView` dropped every className, so every screen rendered blank. |

58 files, ~12,400 lines. `main` is untouched; the Vercel deploy is unaffected.

### Running it

```
cd ~/projects/family-investing-club/apps/mobile && npx expo start
```

Then scan with Expo Go. Sign in with a normal FIC email and password — same Supabase, so real
progress appears. Expo Go works because SDK 57 is the current ceiling (checked live against
`api.expo.dev`, never from memory).

### The three surfaces

| Tab | File | State |
|---|---|---|
| **Learn** | `app/(tabs)/index.tsx` | Serpentine path of pressable discs, "CONTINUE" pin, unit rules, streak/XP/belt strip. Real data. |
| **Picks** | `app/(tabs)/picks.tsx` | Three lanes — Kai, the desk, members. Renders; **all three sources are empty**. |
| **Club** | `app/(tabs)/community.tsx` | Feed plus this week's XP standings. Real data. |
| **You** | `app/(tabs)/profile.tsx` | The full seven-belt ladder, XP-unlocks-the-test stated plainly. |
| Lesson player | `app/lesson/[id].tsx` | Prologue plus six step types. Walks all seven sections of W1.1. |

---

## 3. Architecture, and why

**The Next.js app in this repo is the backend.** Its 108 API routes and the Supabase schema do not
move — that is what makes a new front end a week of work instead of a rewrite. `apps/mobile` is a
sibling of `src/`, so the live Vercel build is untouched. Admin stays on the web; nobody
administers a club from a phone.

**Styling follows the owner-approved policy from earlier the same day:** gluestack-ui v5 for chrome,
hand-rolled for identity.

- *Chrome* (gluestack): the sign-in form — `Input`, `Button`, `FormControl`.
- *Identity* (hand-rolled, `src/ui/`): path nodes, belt knots, ticker marks, the type scale, the
  lesson renderer.

**The palette is generated, never transcribed.**

| Script | Does |
|---|---|
| `scripts/gen-tokens.mjs` | Lifts 32 tokens out of the web app's `globals.css` into `src/theme/tokens.ts` |
| `scripts/gen-theme.mjs` | Writes `global.css`, bridging gluestack's 19 semantic roles onto those tokens |
| `scripts/check-classnames.mjs` | Fails on a className given to an unwrapped third-party component |

`npm run check` runs all three plus `tsc`. **Never hand-edit `tokens.ts` or `global.css`** — run
`npm run palette`. The point of the bridge is that `bg-primary` cannot resolve to anything but FIC
orange, which makes the skill's semantic-tokens-only rule the palette law.

---

## 4. Three toolchain bugs, worked around

These are upstream, not ours. **Do not "clean them up".** Each is commented where it is worked around.

### NativeWind v5 cannot transform any CSS on SDK 57

`failed to deserialize; expected an object-like struct named Specifier`. Proved by shrinking
`global.css` to one line and watching the error jump to Expo's *own* log-box stylesheet. Not our CSS.

**Resolution:** UniWind, the other Tailwind-v4 engine the gluestack skill names, in
`metro.config.js`. NativeWind is uninstalled. gluestack still generates
`import { styled } from "nativewind"` with no way to change that after `init`, so `nativewind` is
**aliased** — in `babel.config.js` and `tsconfig.json` — to `src/compat/nativewind.ts`, a shim
implementing `styled` on `withUniwind`. Aliasing rather than editing means `gluestack-ui add` keeps
working untouched.

### hermes-estree 0.36.1 is missing a file it requires

Ships `dist/generated/` without `predicates.js`, so its own `predicates.js` cannot resolve
`./generated/predicates` and Metro dies before transforming anything. Pinned to `0.36.0` in
`overrides`.

### react-native-css breaks react-native-web on the web target

Its `FlatList` shim reads `_reactNative.FlatList` at module-evaluation time and hits a require
cycle. Only affects `expo start --web`. Native is unaffected.

---

## 5. The mistake worth remembering

The app was reported working twice before it was. Both times the evidence was a **web** run.

On web, react-native-web loads the real stylesheet, so `className` works as plain CSS whether or not
the RN styling engine ever patched a component. **Web is structurally incapable of detecting a
native styling failure.** Two bugs got through:

1. NativeWind installed-but-unwired — fine on web, fatal on device where its runtime loads and
   asserts it wrapped the Metro config.
2. `SafeAreaView` given a `className` it silently drops — fine on web, and on device it collapsed
   `Screen` to zero height, blanking every screen while the inline-styled tab bar kept rendering.

`scripts/check-classnames.mjs` now catches the second class statically. The first is closed by
NativeWind being gone. **Neither replaces a simulator.**

> This machine has Command Line Tools but no Xcode and no Android SDK, so there is no simulator and
> the device is the only place pixels get confirmed. Fixing that needs full Xcode from the App Store
> — `xcode-select --install` is not enough.

---

## 6. Data reality, verified 2026-09-07

### Learn — real

123 lessons; 8 White Belt and 12 Black Belt carry authored `steps`. Belt courses are
`published = false` **on purpose** — that flag keeps them out of the frozen legacy app, whose engine
renders most of our step types as "not available in your app version". They are read by name
(`slug like belt-%`) with a matching RLS grant. `src/data/learn.ts` mirrors the web app's
`lib/live/learning.ts` deliberately; two interpretations of "which lessons are real" would put two
different paths in front of the same member.

### Picks — schema exists, all three sources empty

| Lane | Table | Note |
|---|---|---|
| Kai | `alert_setups` | 36 rows of real engine output, latest 09-04. Daily; rolled up weekly in the app. |
| Desk | `fic_picks` | Empty. Admin-curated: ticker, headline, thesis, video, `is_free`. |
| Members | `fic_club_picks` | Empty. Stance, reason, horizon, confidence, `resolved_return_pct`. |

**`fic_club_picks.author_id` has no foreign key to `profiles`** — a PostgREST embed is a 400. Look
names up in a second query (`displayNames()` in `src/data/picks.ts`). `feed_posts` *does* have the
relationship and embeds fine.

`fic_weeks` also exists and is empty — 26 columns of "Company of the Week" plus family assignments,
from the older family-club framing. Nothing uses it yet.

### Content shapes were wrong until corrected against the authored lessons

Three assumptions that did not survive contact: explainer `body` is an **array** of paragraphs,
`figure` is a `{kind, value, caption}` **object**, `wrongFeedback` is an **array of `{text}`**, one
per option. Check the JSON before writing a renderer.

---

## 7. The web app's `CompareStep` — fixed

`src/components/lesson/sections.tsx:233` was a 2×2 of tinted, rounded, drop-shadowed rectangles: the
one function in that file breaking the rule that this system composes with rules and type rather
than card containers, with `Stage` and `ProcessStep` on either side of it carrying comments saying
exactly that.

It now branches: **three or more columns, or any with a photograph → a ruled ledger**; **two → a
hairline split** with tone carried by a short colour rule instead of a tinted fill. Columns gained an
optional `group`, so "Paid for time / Paid for ownership" reads as structure rather than a colour
hint. Verified at 402px: zero card-like containers in the section, measured not eyeballed.

`compare` is used 11 times across White and Black belt, so all ten two-column uses lost their boxes
too. Same rule, but it touches lessons that already passed educator review.

---

## 8. Open items

| | Item | Note |
|---|---|---|
| 1 | **Push the `group` labels** | `scripts/content/belt-white-m1.json` has them; the database does not. Needs `node scripts/install-lessons.mjs scripts/content/belt-white-m1.json`, which **writes production**. Held for the owner. It is why the two group rules do not appear on the four-ways screen. |
| 2 | **Nothing is deployed** | No EAS build, no TestFlight, no hosted URL. Needs an Expo account and a bundle identifier. |
| 3 | **Picks have no data** | The screen is honest about it, but the surface is empty until the desk publishes, members post, or Kai's weekly roll-up has a week to roll up. |
| 4 | **No simulator** | See §5. The largest risk to everything below. |
| 5 | Belt courses beyond White and Black | Yellow, Green and Blue have no course rows. The ladder shows all seven; only two have lessons. |
| 6 | No sign-up, no password reset | Sign-in only. Members must already exist. |
| 7 | Narration is fetched, not bundled | MP3s come from `EXPO_PUBLIC_ASSET_BASE` (the Vercel deploy). Offline does nothing. |
| 8 | `useColorScheme` throws | `src/compat/nativewind.ts` deliberately throws rather than no-op'ing. If something needs it, use `useUniwind()`. |

---

## 9. Files worth knowing

```
apps/mobile/
  app/                     expo-router — _layout (gate), sign-in, (tabs)/, lesson/[id]
  src/ui/                  identity: type, layout, path, belt, stats, ticker
  src/data/                learn, picks, community — Supabase reads under RLS
  src/lesson/              schema + section renderers (mirrors the web vocabulary)
  src/lib/                 supabase (RN session persistence), api (401 retry)
  src/compat/nativewind.ts the gluestack shim — read the comment before touching
  src/theme/tokens.ts      GENERATED
  global.css               GENERATED
  scripts/                 gen-tokens, gen-theme, check-classnames
```

`src/lib/supabase.ts` ships the RN session wiring on day one — `startAutoRefresh` tied to
`AppState`, a proactive refresh inside the last two minutes, and sign-out on a dead refresh token so
the gate routes to the door. There is no third state that says "session expired" with nowhere to go.
