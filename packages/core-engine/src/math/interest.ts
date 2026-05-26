import type { BasisPoints, Cents } from "./money";
import { assertNonNegativeCents } from "./money";

const BASIS_POINTS_PER_UNIT = 10_000n;
const ACTUAL_365_DAYS = 365n;

export interface SimpleInterestInput {
  principalCents: Cents;
  annualRateBps: BasisPoints;
  days: number;
}

export function calculateActual365InterestCents(input: SimpleInterestInput): Cents {
  assertNonNegativeCents(input.principalCents, "principalCents");

  if (!Number.isInteger(input.annualRateBps) || input.annualRateBps < 0) {
    throw new RangeError("annualRateBps must be a non-negative integer");
  }

  if (!Number.isInteger(input.days) || input.days < 0) {
    throw new RangeError("days must be a non-negative integer");
  }

  // Financial amounts are rounded to the nearest cent only after applying
  // the full Actual/365 formula for the exact period.
  const numerator =
    BigInt(input.principalCents) *
    BigInt(input.annualRateBps) *
    BigInt(input.days);
  const denominator = BASIS_POINTS_PER_UNIT * ACTUAL_365_DAYS;

  return Number(roundHalfUp(numerator, denominator));
}

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}
