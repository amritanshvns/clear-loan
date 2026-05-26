import { describe, expect, it } from "vitest";
import { calculateActual365InterestCents } from "./interest";

describe("calculateActual365InterestCents", () => {
  it("calculates annual simple interest for a full Actual/365 year", () => {
    expect(
      calculateActual365InterestCents({
        principalCents: 100_000,
        annualRateBps: 1_000,
        days: 365
      })
    ).toBe(10_000);
  });

  it("rounds the final interest amount to the nearest cent", () => {
    expect(
      calculateActual365InterestCents({
        principalCents: 100_000,
        annualRateBps: 1_000,
        days: 1
      })
    ).toBe(27);
  });

  it("returns zero interest for zero-day periods", () => {
    expect(
      calculateActual365InterestCents({
        principalCents: 100_000,
        annualRateBps: 1_000,
        days: 0
      })
    ).toBe(0);
  });

  it("rejects negative principal", () => {
    expect(() =>
      calculateActual365InterestCents({
        principalCents: -1,
        annualRateBps: 1_000,
        days: 30
      })
    ).toThrow("principalCents must be non-negative");
  });
});
