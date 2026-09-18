import { readFileSync } from "fs";
import { join } from "path";

/**
 * The entitlement this app unlocks on must be the one RevenueCat grants.
 *
 * It was not. The code checked `entitlements.active["remove_ads"]` -- the value
 * 37 of the 44 projects use -- while this app's project (proja69d625c) grants `pro`.
 * A customer would have paid, the receipt would have been valid, and nothing
 * would have unlocked. No App Store Connect gate can see an entitlement name,
 * so nothing else in the pipeline would have noticed.
 *
 * This test cannot reach RevenueCat: no network in CI, and no secret here that
 * should carry that scope. It pins the constant so a change is deliberate, and
 * carries the command that re-checks the real answer:
 *
 *     rc entitlements list --project-id proja69d625c
 *
 * Verified 2026-09-18: one entitlement, lookup key `pro`.
 */
const VERIFIED_ENTITLEMENT_LOOKUP_KEY = "pro";

describe("the entitlement the app unlocks on", () => {
  it("matches the lookup key RevenueCat actually grants", () => {
    const source = readFileSync(join(__dirname, "..", "purchases.ts"), "utf8");
    expect(source).toContain(
      `const ENTITLEMENT_ID = "${VERIFIED_ENTITLEMENT_LOOKUP_KEY}"`,
    );
  });

  it("does not use the portfolio default, which is wrong for this app", () => {
    const source = readFileSync(join(__dirname, "..", "purchases.ts"), "utf8");
    expect(source).not.toContain('const ENTITLEMENT_ID = "remove_ads"');
  });
});
