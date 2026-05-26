import { describe, expect, it } from "vitest";
import {
  addCents,
  assertNonNegativeCents,
  assertPositiveCents,
  centsToDollars,
  dollarsToCents,
  subtractCents
} from "./money";

describe("money utilities", () => {
  it("converts dollars to integer cents with cent rounding", () => {
    expect(dollarsToCents(10.235)).toBe(1024);
  });

  it("converts integer cents back to dollars", () => {
    expect(centsToDollars(1024)).toBe(10.24);
  });

  it("adds and subtracts integer cents", () => {
    expect(addCents(1_000, 250)).toBe(1_250);
    expect(subtractCents(1_000, 250)).toBe(750);
  });

  it("rejects non-finite currency inputs", () => {
    expect(() => dollarsToCents(Number.NaN)).toThrow("amount must be a finite number");
  });

  it("rejects non-integer cent values", () => {
    expect(() => centsToDollars(10.5)).toThrow("amountCents must be an integer");
  });

  it("rejects negative and zero values for positive cents", () => {
    expect(() => assertPositiveCents(0)).toThrow("amountCents must be positive");
    expect(() => assertPositiveCents(-1)).toThrow("amountCents must be positive");
  });

  it("rejects negative values for non-negative cents", () => {
    expect(() => assertNonNegativeCents(-1)).toThrow("amountCents must be non-negative");
  });
});
