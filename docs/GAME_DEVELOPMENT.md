# Word Connect World — Game Development Document

A complete description of the game, how it is built, and how each part works.
Read this first to understand the whole project; use the deployment roadmap in
`docs/ANDROID_DEPLOYMENT_ROADMAP.md` for the Play Store steps.

---

## 1. What the game is

**Word Connect World** is a sign-in-free, offline-first word puzzle game.
Each level shows a circle of 6–7 letters; the player swipes or taps letters to
form hidden words. Finding enough words fills a progress bar to 100% and
completes the level.

- 2,500 procedurally generated levels
- Easy / Medium / Hard difficulty pacing
- Coins economy: hints, star conversion, rewarded ads
- 1–3 star rating per level based on hint usage
- Cloud save backup via a restore code — no accounts
- Native Android app (Capacitor), also runs in any browser

**App identity**

| Field | Value |
|---|---|
| App name | Word Connect World |
| Package / app ID | `com.wordconnect.app` |
| Platform | Android (Capacitor 8) + web |
| Min Android | 24 (Android 7.0) |
| Target SDK | 36 |

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript, JSX |
| Styling | Tailwind CSS with theme tokens passed as inline styles |
| Icons | lucide-react |
| Build | Vite |
| Native shell | Capacitor 8 (Android) |
| Ads | `@capacitor-community/admob` v8 (Google AdMob) |
| Dictionary | `an-array-of-english-words` (~275k entries) + supplemental common words |
| Cloud | Supabase (Postgres) — device-keyed save backup |
| Sound | Web Audio API — synthesized tones, no audio files |

---

## 3. Project structure

```
src/
├── App.tsx                     # Game screen: all state + game rules
├── main.tsx                    # React entry
├── index.css                   # Tailwind + keyframe animations
├── components/
│   ├── TopBar.tsx              # Score, coins, level, difficulty, sound toggle
│   ├── WordSlot.tsx            # Current word display + feedback messages
│   ├── LetterCircle.tsx        # Circular letter picker (tap + swipe)
│   ├── FoundGrid.tsx           # Grid of found words
│   ├── FlyingWord.tsx          # Fly-to-grid animation on word found
│   ├── AnimatedBackground.tsx  # Theme gradient + animated glows
│   ├── AnimatedLogo.tsx        # Animated logo at top of play area
│   ├── ProgressBar.tsx         # Level progress + star rating
│   ├── HintBar.tsx             # Paid hint button + auto-hint countdown
│   ├── LevelCompleteModal.tsx  # Results, stars, rewarded-ad double coins
│   ├── StarConversionModal.tsx # Convert score to coins
│   ├── Tutorial.tsx            # First-launch tutorial
│   ├── RestoreDialog.tsx       # Cloud save restore offer
│   └── Fireworks.tsx           # Celebration particle effect
└── game/
    ├── levels.ts     # 2,500 procedural levels, difficulty cycle, player seed
    ├── words.ts      # Dictionary + formable-word computation
    ├── puzzle.ts     # Letter shuffle helper + legacy puzzle data
    ├── themes.ts     # 10 color themes mapped to level seed words
    ├── sound.ts      # Synthesized SFX engine
    ├── ads.ts        # AdMob: init, consent, rewarded, interstitial
    └── cloudSave.ts  # Supabase device-keyed backup + restore code
```

---

## 4. Core game systems

### 4.1 Procedural level generation (`src/game/levels.ts`)

Levels are not hand-built. Each level:

1. Picks a **seed word** (6–7 letters, e.g. GARDEN, CASTLE) from a pool of 73.
2. The seed's letters become the level's letter circle.
3. A **player seed** — a random number generated once on the device and kept
   forever — rotates each player differently through the seed pool, so no two
   players see the same level sequence.
4. A deterministic seeded shuffle orders the letters (same shuffle every
   launch for the same player — a level is always the same puzzle).

**Difficulty pacing** — levels 1–10 are easy to teach the mechanics. From
level 11, a 20-level repeating cycle provides variety and never more than 3
hard levels in a row:

```
2 medium, 1 easy, 2 medium, 3 hard, 1 easy, 2 medium, 3 hard, 1 easy, ...
```

Difficulty also sets the **mastery bonus** (coins paid on level completion):
easy 15, medium 25, hard 40 — plus 50 extra coins for a hard level completed
with zero hints (the "hard mode streak").

### 4.2 Dictionary and formable words (`src/game/words.ts`)

- The dictionary is the `an-array-of-english-words` package (~275k entries),
  filtered to 3–7 letters, uppercased, de-duplicated, plus a hand-written
  supplemental list of everyday words the package omits (inflections, short
  words like A, I, AM).
- `getFormableWords(letters)` scans the dictionary for every word that can be
  built from the level's letters (respecting letter counts). Results are
  cached by sorted-letter key so this runs once per unique letter set, not
  once per level — this keeps startup fast.

### 4.3 Scoring (`src/game/levels.ts`)

Levels complete at a **100-point goal**. Each found word adds points by its
length:

| Word length | Points toward completion |
|---|---|
| 3 letters | 20 |
| 4 letters | 25 |
| 5+ letters | 30 |

Additional rules:
- Words revealed by a hint earn **half score**, but full points toward the
  100-point completion goal (hints speed you up; they don't make completion
  harder).
- Forming the full seed word (using every letter) pays a **50 bonus coin**.
- Every found word also pays **1 coin per letter**.
- Level completion pays the difficulty **mastery bonus** (15/25/40) and the
  possible **hard mode streak** (+50).

### 4.4 Hints (`src/App.tsx`)

Two hint systems:

1. **Paid hint** — button in the HintBar. Reveals an entire unfound word.
   Costs escalate within a level: 25, 50, 75, 100, ... coins (resets each
   level). If the player can't afford it, an "watch ad for coins" alert
   appears.
2. **Free auto-hint** — after 30 seconds idle, reveals one letter of an
   unfound word, then one more letter every 60 seconds. Any interaction
   resets the timer. Keeps revealing the same word letter-by-letter before
   moving to the next one.

### 4.5 Star rating

Each level awards 1–3 stars. Every letter revealed by hints (paid or auto)
costs one star; 3+ revealed letters loses all stars. Displayed in the progress
bar during play and on the Level Complete screen.

### 4.6 Coins economy

| Source | Amount |
|---|---|
| Found word | 1 per letter |
| Full seed word found | +50 |
| Level completion | mastery bonus (15/25/40) |
| Hard level, zero hints | +50 streak |
| Rewarded ad (Level Complete) | doubles level coins, once per level |
| Star conversion | 10 score → 1 coin, via the TopBar menu |

| Sink | Amount |
|---|---|
| Paid hint | 25, 50, 75, 100... (escalating within a level) |

Starting balance: 50 coins on first launch.

### 4.7 Sound (`src/game/sound.ts`)

All sound effects are **synthesized** with the Web Audio API — no audio files
to load. Tones: letter tap (pitch rises per picked letter), word valid
(arpeggio), word invalid (descending saw), hint, coin, level-complete fanfare,
star. A toggle in the TopBar persists to local storage.

### 4.8 Themes (`src/game/themes.ts`)

10 color themes (Emerald, Ocean, Sunset, Forest, Night, Desert, Crimson,
Arctic, Sage, Steel). Each level's seed word maps to a fitting mood
(GARDEN → Forest, OCEANS → Ocean, VOLCANO → Crimson); unmatched seeds fall
back to a stable per-level hash so colors still vary. A theme drives the
background gradient, animated glows, and accent colors of all controls.

---

## 5. Persistence

### 5.1 Local save (primary)

All progress is stored in `localStorage` under `wordlink-progress-v1`:
level index, score, coins, found words per level, hinted words per level.
The game is fully playable offline.

### 5.2 Cloud backup (Supabase, sign-in free)

`src/game/cloudSave.ts` mirrors the local save to a Postgres table
(`device_saves`) 3 seconds after any progress change:

- No accounts. Each device generates a random ID once and keeps it locally.
- The row key is that device ID; the **restore code** is its last 6
  characters, which the player can type into a fresh install to recover
  progress (also works across devices).
- On reinstall, the game checks the cloud for a backup once the tutorial is
  dismissed and offers the Restore dialog.
- Schema: `device_id` (PK), `player_seed`, `level`, `coins`, `stars`, `stats`
  (jsonb: found/hinted words), `updated_at`. Migration:
  `supabase/migrations/20261021075317_create_device_saves.sql`.
- RLS is enabled; since the app is intentionally sign-in-free, policies are
  device-keyed rather than user-keyed. When sign-in is added later, device
  rows should be migrated to user-owned rows at sign-up.

---

## 6. Ads integration (`src/game/ads.ts`)

Powered by Google AdMob through `@capacitor-community/admob`. Ads exist only
in the native app build — the browser preview never loads the ad SDK.

| Ad type | Trigger | Frequency cap |
|---|---|---|
| Rewarded | "Watch ad — double coins" on Level Complete | Once per level, reward only granted on completion |
| Interstitial | Between levels, on "Next" | At most every 3rd level |

- **Consent (GDPR/UMP)** — on first launch in EU/UK, Google's hosted consent
  form appears before any ad. The message itself is created and published in
  AdMob → Privacy & messaging (see roadmap Phase 3).
- **Test IDs** — all ad IDs are currently Google's official test values; the
  app never serves real ads (or earns revenue) until the real IDs are
  supplied. Two places need them: the AdMob App ID in the Android manifest
  and the ad unit IDs in `src/game/ads.ts` (or env vars).
- The interstitial preloads the next ad immediately after showing, so level
  transitions stay instant.

---

## 7. Player flows

### 7.1 First launch
1. Tutorial shows (once; dismissal flag kept in local storage).
2. Player seed and device ID are generated and kept on the device.
3. Cloud is checked for a backup; if found, the Restore dialog is offered.
4. Ad SDK initializes and preloads (native only); consent form may show.

### 7.2 Playing a level
Tap or swipe letters in the circle → word assembles in the slot → submit
(auto on swipe end if 3+ letters). Valid words fly to the found grid, pay
coins/score, and fill the progress bar. Reaching 100 points triggers the
fanfare and the Level Complete screen.

### 7.3 Level complete
Shows stars, words found, level score, coins earned (including streak bonus).
One-time offers: **double coins via rewarded ad**, star conversion via TopBar.
Next button shows an interstitial (at most every 3rd level) and advances.
After level 2,500, the game restarts from level 1 keeping coins.

### 7.4 Reinstall / new device
Restore dialog appears automatically if a cloud backup exists for the device
ID; the player can also enter a 6-character restore code from another device.

---

## 8. UI/UX design notes

- Layout is a single centered mobile column (max width ~448px) that fills the
  viewport height — designed phone-first, responsive on any screen.
- The letter picker is a **circular swipeable wheel** (tap letters or drag
  through them; swipe across a used letter retracts the selection).
- 8px spacing system, 3 font weights, generous letter-form areas.
- Micro-interactions: pop animations on modals and stars, flying word to grid,
  active-scale on all buttons, animated background glows.
- Contrast is enforced by passing theme-controlled ink/accent colors to every
  control — text is always readable over gradients.

---

## 9. Builds

| Command | Purpose |
|---|---|
| `npm run build` | Web production build → `dist/` |
| `npx cap sync android` | Copy `dist/` + plugin config into `android/` |
| `cd android && ./gradlew bundleRelease` | Signed release AAB for Play Store |

`capacitor.config.ts` sets the app ID (`com.wordconnect.app`), display name,
web directory, and background color. Release signing and keystore steps are
covered in the deployment roadmap, Phase 5.

---

## 10. Known pending items

| Item | Status |
|---|---|
| Real AdMob IDs (App ID + rewarded + interstitial) | Waiting on AdMob account approval |
| GDPR consent message publish | Waiting — wizard steps in roadmap Phase 3 |
| Privacy policy URL | Needed for consent message + Play Console |
| Release keystore | Create at release time; back it up |
| Store listing assets | Icon, feature graphic, screenshots, descriptions |
| `puzzle.ts` legacy puzzle data | Kept for reference; superseded by procedural generation |
