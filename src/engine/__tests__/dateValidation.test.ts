import { isLikelyValidDate } from "../dateValidation";

describe("isLikelyValidDate", () => {
  it("accepts ISO format", () => {
    expect(isLikelyValidDate("2026-09-29")).toBe(true);
  });

  it("accepts common slash formats", () => {
    expect(isLikelyValidDate("09/29/2026")).toBe(true);
    expect(isLikelyValidDate("29/09/2026")).toBe(true);
  });

  it("accepts dot and dash separated formats", () => {
    expect(isLikelyValidDate("29.09.2026")).toBe(true);
    expect(isLikelyValidDate("09-29-2026")).toBe(true);
  });

  it("rejects an empty or whitespace-only string", () => {
    expect(isLikelyValidDate("")).toBe(false);
    expect(isLikelyValidDate("   ")).toBe(false);
  });

  it("rejects free text that is not a date", () => {
    expect(isLikelyValidDate("not a date")).toBe(false);
    expect(isLikelyValidDate("asap")).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    expect(isLikelyValidDate("2026-13-40")).toBe(false);
    expect(isLikelyValidDate("02/30/2026")).toBe(false);
  });

  it("rejects a two-digit year the pattern does not cover", () => {
    expect(isLikelyValidDate("9/29/26")).toBe(false);
  });

  it("is tolerant of surrounding whitespace", () => {
    expect(isLikelyValidDate("  2026-09-29  ")).toBe(true);
  });
});
