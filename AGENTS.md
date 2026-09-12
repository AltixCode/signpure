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

## 6. Mandatory 12-Language Localization Protocol
* **Required Languages (12 Tier-1 Global Markets):**
  1. English (`en`) - Default / Fallback
  2. Spanish (`es`) - Latin America & Spain
  3. French (`fr`) - France & Francophone markets
  4. German (`de`) - DACH region
  5. Russian (`ru`) - Eastern Europe & Central Asia
  6. Simplified Chinese (`zh`) - Greater China
  7. Japanese (`ja`) - Japan
  8. Brazilian Portuguese (`pt`) - Brazil & Portugal
  9. Korean (`ko`) - South Korea
  10. Italian (`it`) - Italy
  11. Turkish (`tr`) - Turkey & MENA/Turkic region
  12. Arabic (`ar`) - Middle East & North Africa (RTL supported)
* **Zero Hardcoded Strings Rule:**
  - Every UI string, button, title, alert, and paywall message MUST use `t('key')` from `src/i18n`.
  - Adding features or modifying screens requires updating all 12 language dictionaries in `src/i18n/index.ts`.
* **Anti-Subscription Promise Localization:**
  - The anti-subscription value proposition must be clearly translated in all 12 languages:
    *"No Subscriptions. No Accounts. 100% On-Device Privacy. Own It Forever."*
* **Device Locale Detection:**
  - Locale is automatically resolved via `expo-localization`'s `Localization.getLocales()[0]?.languageCode`.
  - Unknown or missing locales cleanly fallback to English (`en`).

