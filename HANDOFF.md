# SignPure — handoff

Written 2026-09-15. Everything below was checked against the live consoles and
the repo on that date, not inferred.

**Where this app stands:** the code is done and verified on both platforms. It
cannot be submitted yet, and the reasons are mostly outside this repo — AdMob is
not configured for it, the legal URLs 404, and no build has ever been uploaded
to either store.

---

## Identifiers

| | |
|---|---|
| Bundle id / package | `com.altixcode.signpure` |
| App Store Connect app | `6811549158` (version 1.0, `PREPARE_FOR_SUBMISSION`) |
| In-app purchase | `signpure_pro_lifetime` — ASC id `6811578500`, state `MISSING_METADATA` |
| RevenueCat project | `proja69d625c` |
| RevenueCat apps | iOS `app3483ee2023` · Android `app1fdaf23132` |
| RevenueCat entitlement | `pro` — ❌ **mismatch** — code reads `remove_ads` |
| Play Console | record exists, no active release |
| AdMob | nothing created |

---

## What is done

- **Ads**: AdMob banner + interstitial through the shared portfolio integration
  (`src/services/ads.ts`, `adPolicy.ts`, `adPacing.ts`, `adPacingFile.ts`,
  `consentPolicy.ts`, `src/store/adsStore.ts`, `src/components/AdBanner.tsx`).
  These files are byte-identical across the portfolio — change them in CapFlow
  and re-port with `Dev/scripts/port-ads.mjs`, never in one app alone.
- **Interstitial**: app/editor.tsx — behind the share sheet for a signed PDF. Pacing lives in `adPolicy.ts`: the first completion
  is always clean, then every 2nd, minimum 90s apart, and never for a user who
  owns the upgrade. Counters persist across launches in `ad-pacing.json`.
- **Consent**: UMP → ATT → SDK init, in that order, failing closed. Ads start
  only once entitlement is known and only for users who have not paid, so a
  paying user never sees a GDPR form or an ATT prompt. A dev-only
  `[ads] consent {...}` line is logged; it is how the build harness proves the
  app reached the ads service.
- **Entitlement**: the code reads `remove_ads`. RevenueCat still holds
  `pro` — see the first item under "What is left", because in this state a
  purchase unlocks nothing.
- **Release gate**: `npm run check:release` refuses a build whose identifiers
  are absent, blank, or still a Google test unit. It runs in the store-build workflow before anything is built.
- **Tests**: 55 passing, typecheck clean.
- **Localization**: 14 locales (including `ar` and `fa`)
- **CI**: `.github/workflows/ci.yml` runs typecheck, the test suite and both
  bundle exports.
- **Store build**: `.github/workflows/deploy.yml` builds, signs and uploads to
  TestFlight and Play. It runs `npm run check:release` in both build jobs,
  with the identifiers declared once at workflow level — they were not
  passed to the build at all before, which would have shipped test ad units.
- **Verified on device**: Android — built, installed, launched, consent
  resolved, and the AdMob test banner rendered anchored at the bottom with the
  layout intact. iOS — built, installed, launched, renders, consent flow
  reached.

---

## What is left that an agent can do

1. **Fix the entitlement mismatch — this one ships broken.**
   RevenueCat holds `pro`; the code reads `remove_ads`. A purchase would
   succeed, charge the customer, and unlock nothing. Either create the
   entitlement and attach the existing product:

   ```bash
   rc entitlements create --lookup-key remove_ads \
     --display-name "Pro — Ad-Free & Unlimited" --project-id proja69d625c --json --yes
   rc entitlements attach <entitlementId> <productId> --project-id proja69d625c --json --yes
   ```

   …or change `ENTITLEMENT_ID` back to `pro` in `src/services/purchases.ts`.
   The first is the portfolio decision; do not leave them disagreeing.

2. **Upload the screenshots to App Store Connect.** 6 exist on disk under
   `store/screenshots/` at both required sizes; zero are uploaded.

3. **Nothing to write for the listing** — 5 locales already carry a
   description and keywords in App Store Connect. The copy lives in
   `Dev/scripts/store-metadata.json`; it now discloses that ads are served by
   Google AdMob, which the previous text did not.

4. **Upload the IAP review screenshot.** The in-app purchase
   (`signpure_pro_lifetime`) is localized and priced at $3.99, and sits at
   `MISSING_METADATA` for want of one screenshot:

   ```bash
   asccli iap-review-screenshot upload --iap-id 6811578500 --file <path-to-png>
   ```

5. **Rename the purchase.** Its App Store display name and description still
   describe only half of what it does. One purchase removes the ads *and*
   unlocks the paid features, so both halves belong in the copy — something
   like "Pro — Ad-Free & Unlimited" (name ≤ 30 chars, description ≤ 45):

   ```bash
   asccli iap-localizations update --localization-id <id> \
     --name "Pro — Ad-Free & Unlimited" --description "<= 45 chars"
   ```

6. **RTL layout pass.** `ar` and `fa` copy is present and
   `plugins/withAndroidRtl.js` is wired, but the layouts have not been walked in
   RTL. Deliberately left until last.

---

## What only you can do

1. **AdMob — nothing exists for this app.** There is no write API at all; it is
   console-only. Create the app on both platforms, then banner and interstitial ad units,
   and note the ids. Answer **"No, not listed on a supported app store"** while
   the app is unpublished — linking later does not change the ids.

   Then publish a **GDPR message and a US-states message** under Privacy &
   messaging. The SDK can only present a message that exists, and this app fails
   closed on missing consent — so without them it shows **no ads at all** in the
   EEA. Expect "Requires review — limited ad serving" for a couple of days after
   the app goes live; that is not an integration bug.

2. **RevenueCat — Apple credentials.** `app3483ee2023` (the App Store app in project
   `proja69d625c`) has no Apple credentials, so App Store purchases cannot be
   validated. This needs an interactive Apple ID sign-in with 2FA:

   ```bash
   rc setup apple app3483ee2023
   ```

   An App Store Connect *API* key can be set non-interactively; the separate
   **In-App Purchase key** cannot, which is why this one is yours.

3. **GitHub secrets.** The signing secrets are all present
   (`APP_KEYSTORE_*`, `APP_STORE_CONNECT_API_KEY_*`,
   `PLAY_STORE_SERVICE_ACCOUNT_JSON`). These are **not**, and CI now fails
   without them — deliberately, because a build missing one earns nothing while
   looking perfectly healthy:

   ```
   EXPO_PUBLIC_ADMOB_IOS_APP_ID
   EXPO_PUBLIC_ADMOB_ANDROID_APP_ID
   EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL
   EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL
   EXPO_PUBLIC_ADMOB_IOS_BANNER
   EXPO_PUBLIC_ADMOB_ANDROID_BANNER
   EXPO_PUBLIC_REVENUECAT_IOS_KEY
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
   ```

   Set each with `gh secret set <KEY> --repo AltixCode/signpure`. The RevenueCat
   public SDK keys are fetchable — `rc api GET "/projects/proja69d625c/apps/app3483ee2023/public_api_keys"`
   — the AdMob ones come from step 1.

4. **The legal URLs are wrong and they 404.** `src/config/legal.ts` points at
   `https://www.hushtunnel.com/legal/signpure-privacy` — **hushtunnel.com**, a leftover from the HushTunnel
   template, not an AltixCode domain at all.

   Nothing is served there: altixcode.com only has `/legal/privacy`,
   `/legal/terms` and `/legal/cookies`. Both stores require a working privacy
   policy, the App Store record needs the same URL, and the policy text must now
   disclose that ads are served by Google AdMob and that ATT/UMP consent governs
   personalisation. Either publish per-app pages under altixcode.com or point
   `src/config/legal.ts` at the generic ones — either way the ads paragraph has to be
   written.

5. **Play Console — the app record exists.** `com.altixcode.signpure` is recognised,
   so a bundle has been uploaded at least once. No track has an active release,
   and the data safety form still needs completing (it must now declare the ad
   SDK's data collection).

6. **App Store review contact.** No contact email or phone is set in App Store
   review information; the readiness check fails on it.

7. **The self-hosted macOS runner has been stopped since 2026-09-13** (it filled
   the disk). Every workflow in this repo targets it and queues indefinitely
   until it is back.

8. **No EAS project is linked.** `eas env:list` and any EAS build refuse with
   "EAS project not configured", and a robot token cannot configure it
   interactively — it needs `eas init --id <project-id> --non-interactive`, with
   `owner` and the project id then set by hand in the app config.

9. **Play Developer Reporting API is disabled** for project 1013025269741, so
   `gplay apps list` returns 403. The service account cannot enable it
   (`serviceusage.services.enable` is missing); it has to be enabled in the
   Cloud Console.

---

## Fixed recently — context for anything that looks odd

- **Privacy copy that ads made untrue.** Screens promising "no tracking" were
  corrected in every locale: the app's own content still never leaves the phone,
  but the ads do reach the internet and the copy now says so.
- The store description's PRIVACY paragraph now discloses that ads are served by
  Google AdMob and that the one-time purchase removes them.

---

## Traps already paid for — do not rediscover these

- **`react-native-google-mobile-ads` must stay pinned to exactly 16.3.4.** 16.4+
  pulls play-services-ads 25.3+, whose Kotlin 2.3.0 metadata SDK 57's Kotlin
  2.1.0 refuses to read. Forcing Kotlin up instead breaks `react-native-purchases`
  and `safe-area-context`.
- **iOS 26+ needs UIScene adoption** (`plugins/withIOSSceneLifecycle`). Without
  it the app installs, launches, and quits straight back to the home screen,
  with nothing on screen to explain why.
- **`JAVA_HOME` must be** `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
  for any Android build. Gradle otherwise falls back to JDK 25 and CMake dies.
- **A missing identifier fails nothing.** The app falls back to Google's test ad
  units, works perfectly, and earns nothing. That is what `check:release` exists
  to stop.
- **`expo run:android` can fail in a second and leave the previous APK
  installed** — the app then launches, renders, and proves nothing. Check the
  build's own exit code before believing a screenshot.
- **Simulator.app is missing from this Xcode install**, so the ATT prompt cannot
  be dismissed on iOS. iOS verification ends at "builds, installs, launches,
  renders"; drive interaction on Android.

---

## Commands

```bash
npm run typecheck && npm test          # both clean as of 2026-09-15
npm run check:release                  # fails until the identifiers exist — correct
../scripts/verify-app.sh signpure com.altixcode.signpure   # full build + device verification, both platforms
```

The portfolio-wide notes live in `Dev/AGENTS.md`, and the store/console playbook
in `Dev/gridlock-pop/docs/mobile-playbook.md`. The shared ad integration is
ported by `Dev/scripts/port-ads.mjs` from CapFlow, which is the reference.

---

## One caution

Everything in this repo is **uncommitted**. Read `git status` before assuming
the working tree matches `main`.
