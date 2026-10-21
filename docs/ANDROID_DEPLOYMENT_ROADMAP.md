# Word Link — Android Play Store Deployment Roadmap

A complete, step-by-step guide to take this game from development to a live
listing on the Google Play Store, including Google AdMob ads integration and
GDPR consent.

---

## Current project status

| Item | Status |
|---|---|
| Capacitor Android project | Done — the `android/` folder is fully configured |
| App registered as a game | Done — game categories set in the Android manifest |
| AdMob plugin installed | Done — `@capacitor-community/admob` v8 |
| Rewarded ad (double coins) | Done — wired to the Level Complete screen |
| Interstitial ad (every 3rd level) | Done — with preloading |
| GDPR consent flow (UMP SDK) | Done — shows Google's consent form in EU/UK |
| Real AdMob IDs | **Pending — you must supply these** |
| Privacy policy URL | **Pending — required for Play + consent message** |
| Play Developer account | **Pending — one-time $25** |
| AdMob account | **Pending** |
| Release keystore | **Pending — must create and back up** |
| Store listing assets | **Pending** |

Currently the app uses **Google test ad IDs everywhere**. It is safe to develop
and test with these; they never generate revenue and never risk your AdMob
account.

---

## Phase 1 — Accounts & registrations

### 1.1 Google Play Developer account
1. Go to https://play.google.com/console
2. Pay the one-time **$25** registration fee.
3. Complete identity verification (can take 1–3 days).

### 1.2 AdMob account
1. Go to https://admob.google.com
2. Sign in with the Google account you want to receive payments.
3. Complete billing/contact details.

---

## Phase 2 — AdMob app & ad unit registration

### 2.1 Register the app in AdMob
1. AdMob dashboard → **Apps → Add app**.
2. Platform: **Android**. Listed on a store: **No** (until it's published).
3. Note the **AdMob App ID** — format: `ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN`

### 2.2 Create ad units
Recommended mix for this game:
- **Rewarded** — used for "Watch ad — double coins" on Level Complete.
  Consider a second unit later for "free hint".
- **Interstitial** — full-screen ad between levels.

Skip banner units for now; the game's layout is fully occupied and rewarded +
interstitial earn more per impression in word games.

Note each **ad unit ID** — format: `ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN`

### 2.3 Supplying your real IDs
Once you have the three IDs, two places need them:

1. **Android manifest** — replace the test App ID:
   ```
   android/app/src/main/AndroidManifest.xml
   ```
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-3940256099942544~3347511713" />
   ```
   Replace the `android:value` with your real App ID.

2. **Ad unit IDs** — either via `.env`:
   ```
   VITE_ADMOB_REWARDED_ID=ca-app-pub-XXXX~YYYY
   VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXX~ZZZZ
   ```
   or edit the constants at the top of `src/game/ads.ts`.

**Never ship with the test App ID `~3347511713`** — Google will reject the
build. Test ad unit IDs (`/5224354917`, `/1033173712`) can technically ship,
but you earn nothing; always swap in real unit IDs before release.

---

## Phase 3 — GDPR consent message (Privacy & messaging)

Your app code already integrates Google's UMP SDK — it requests consent info
on first launch and shows Google's hosted form automatically. You only need to
create and publish the message.

### 3.1 Create the European regulations message
1. AdMob dashboard → **Privacy & messaging**.
2. Prerequisite: the app must be registered (Phase 2.1).
3. Click **Create a European regulations message**.
4. Message type: **Consent**.
5. Select your Android app.

### 3.2 Privacy policy URL (mandatory)
Google will not let you publish the message without it. Create a simple page
stating:
- What data is collected:
  - Advertising identifiers (collected by Google AdMob for ad serving)
  - Game progress: level, score, coins, found words — stored under an
    anonymous device key via Supabase
- That you do not collect names, emails, or contacts
- A contact email for privacy questions

Host it free on Netlify, GitHub Pages, or any static host. Keep the URL stable
— it's referenced in multiple places (Play Console, consent message).

### 3.3 Style the message
- **Buttons — enable all three**: "Consent", "Do not consent", "Manage
  options". Since January 2024 Google **requires** an equal "do not consent"
  option; a message with only a Consent button will not pass review.
- Language: English (add more when you localize).
- Optionally match the colors to the game's teal/green theme.

### 3.4 Publish
- Hit **Publish**. It goes live within minutes.
- No further code changes are needed — the app shows this form automatically
  on first launch for EU/UK players.

### 3.5 Verify
Run the app on a device or emulator with a VPN set to an EU country: the
consent dialog should appear before any ad is served.

---

## Phase 4 — Legal & Play Console compliance

These are the most common rejection reasons. Complete them all.

### 4.1 Privacy policy
- Same URL as Phase 3.2.
- Play Console → App content → **Privacy policy** — paste the URL.

### 4.2 Data safety form
Play Console → App content → **Data safety**. Declare honestly:
| Data | Collected | Shared | Purpose |
|---|---|---|---|
| Advertising ID (via AdMob) | Yes | Yes (Google) | Ads |
| Game progress (level, score, coins) | Yes | No | App functionality, cloud backup |
| Name / email / contacts | No | No | — |

### 4.3 Content rating (IARC)
- Play Console → App content → **Content rating**.
- Fill the questionnaire honestly. Word/puzzle games typically get **Everyone**.
- Answer the ads-related questions accurately — the app contains ads.

### 4.4 Ads declaration
- Play Console → App content → **Ads** → declare **Yes, contains ads**.
- Since AdMob is integrated, this is mandatory and non-negotiable.

### 4.5 Target audience
- Play Console → App content → **Target audience**.
- **Recommendation: declare 13+ (or 18+).**
  - Declaring children under 13 pulls the app into Google's **families
    policy** — much stricter ads rules (no personalized ads, certified ad
    networks only) and a harder review.
  - The game must not be designed to appeal *primarily* to children if you
    declare 13+; keep store art and screenshots age-neutral.

### 4.6 Rest of the App content checklist
Complete every remaining item in Play Console → App content (news declaration,
COVID declaration, government apps declaration, financial features, etc. —
for this game most answers are simply "No").

---

## Phase 5 — Build & sign the release

### 5.1 Create an upload keystore
One keystore per app. **Back it up and never lose it** — losing it means you
can never update the app under the same listing again.

```bash
keytool -genkey -v -keystore wordlink-release.keystore \
  -alias wordlink -keyalg RSA -keysize 2048 -validity 10000
```

Store:
- the `.keystore` file somewhere safe (cloud vault, password manager attachment)
- the keystore password and key alias/password

Do **not** commit the keystore to the repository.

### 5.2 Set app signing
Play Console → **Setup → App signing**:
- Google Play App Signing (recommended): upload the key from 5.1 as the
  *upload key*; Google holds and protects the real signing key.
- Keep the version code unique and increasing on every upload:
  `android/app/build.gradle` → `versionCode` / `versionName`.

### 5.3 Build the release bundle (AAB)
```bash
npm run build && npx cap sync android
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

If Gradle prompts for the keystore on release builds, wire the signing config
in `android/app/build.gradle` (keyAlias, storeFile, passwords) — keep the
passwords in `~/.gradle/gradle.properties` or environment variables, never in
the repo.

### 5.4 Test the signed build
Before uploading:
- Install on a real device (`./gradlew installRelease` or adb).
- Verify: ads show (rewarded doubles coins; interstitial fires every 3rd
  level), consent form appears, sound toggles work, cloud save round-trips.

---

## Phase 6 — Store listing assets

Prepare all of these before starting the listing:

| Asset | Requirement |
|---|---|
| App name | 30 chars max |
| Short description | 80 chars max |
| Full description | 4000 chars max |
| App icon | 512×512 PNG |
| Feature graphic | 1024×500 (no text on edges) |
| Phone screenshots | Min 2; recommended 4–8 at 1080×1920 |
| Category | **Word** or **Puzzle** |

The existing logo (`public/wcw-logo-3d.webp`) and icons can be re-exported.
Capture gameplay screenshots from the running app.

---

## Phase 7 — Play Console release flow

1. **Create app** in Play Console → complete App content (Phase 4).
2. **Internal testing track** first — upload the AAB, add testers by email,
   install via the test-opt-in link, verify ads + saves + consent.
3. **Production track** — upload the AAB, complete the listing, submit for
   review.
4. First review typically takes **1–7 days**.
5. Common word-game rejections: missing privacy policy, misleading
   screenshots, target-audience/ads mismatch, test App ID left in the
   manifest. Fix per the notice and resubmit.

---

## Phase 8 — Post-launch

- **AdMob earnings**: usually need a few hundred impressions before revenue
  shows; rewarded ads earn the most per impression.
- **Update cadence**: bump `versionCode`, rebuild AAB, upload to Production
  (or a test track first). Review is much faster after the first approval.
- **Checklist for every update**: swap in real ad unit IDs (if not already),
  test the signed build, confirm consent flow still works.
- Watch AdMob's **policy center** for any flagged ad behavior — unresolved
  policy strikes can limit your AdMob account.

---

## Quick reference — where things live in this repo

| What | Where |
|---|---|
| Ad module (IDs, init, consent) | `src/game/ads.ts` |
| AdMob App ID in manifest | `android/app/src/main/AndroidManifest.xml` |
| Level Complete (rewarded ad button) | `src/components/LevelCompleteModal.tsx` |
| App wiring (init, interstitial) | `src/App.tsx` |
| Android project | `android/` |
| Web build output | `dist/` |
