# SignPure — Agent Runbook & Operating Directive

## 1. System Overview & Identifiers
* **App Name:** SignPure
* **Bundle Identifier (iOS):** `com.altixcode.signpure`
* **Package Name (Android):** `com.altixcode.signpure`
* **URL Scheme:** `signpure://`
* **Monetization Model:** Free download with a single **$9.99 Lifetime Non-Consumable IAP** lifetime unlock
* **Entitlement ID:** `pro`
* **Architecture:** 100% On-Device execution, zero external server compute ($0.00 marginal cost).

## 2. Environment Variables & Secrets
```bash
EXPO_PUBLIC_RC_IOS_KEY="appl_placeholder"
EXPO_PUBLIC_RC_ANDROID_KEY="goog_placeholder"
```

## 3. Development & Build CLI Commands
```bash
# Start local Metro dev server
npx expo start

# Run iOS simulator
npx expo run:ios

# Run Android simulator
npx expo run:android

# Generate Native Prebuild
npx expo prebuild --clean

# Type check
npx tsc --noEmit
```

## 4. Legal Pages & Coolify Hosting
Static legal landing pages for Privacy Policy and Terms of Service are hosted at:
* `https://www.altixcode.com/legal/signpure-privacy`
* `https://www.altixcode.com/legal/signpure-terms`
Deployed via Coolify on Hetzner VPS (`2.28.42.222`).

## 5. Technical Gotchas & Edge Cases
* Zero-log and zero-cloud invariants: No remote analytics, error trackers, or telemetry that uploads user media or identifiers.
* All processing must occur in local sandboxed storage and stream to `expo-media-library` or `expo-sharing`.

## 6. Localization

Governed by `docs/agents/12-product-standards.md` §16.1 in the portfolio root.
Fourteen locales, ten of them mandatory, with RTL layout required for Persian
(`fa`) and Arabic (`ar`). Do not restate the locale list here — it drifted once
already.

Use `scripts/add-i18n-keys.mjs` from the portfolio root to add a key; it refuses
to write a partial set, so a key cannot ship English to a market by accident.
