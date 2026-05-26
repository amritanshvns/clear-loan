import { describe, expect, it } from "vitest";
import { sortLoanEvents, validateAndSortLoanEvents } from "./order";
import type { LoanEvent } from "./types";

const baseEvent = {
  schemaVersion: "1.0",
  metadata: {
    source: "test"
  }
} as const;

describe("event ordering", () => {
  it("sorts by effectiveDate and then appliedAt", () => {
    const laterApplied: LoanEvent = {
      ...baseEvent,
      id: "494f1b6e-6c52-4e0f-bf28-a46434c72df0",
      type: "PREPAYMENT",
      effectiveDate: "2026-06-01",
      appliedAt: "2026-05-26T10:10:00.000Z",
      payload: {
        amountCents: 10_000,
        strategy: "REDUCE_TENURE"
      }
    };

    const earlierApplied: LoanEvent = {
      ...baseEvent,
      id: "686217c7-d5a6-4ab6-a6a7-0918c1f026a7",
      type: "RATE_CHANGE",
      effectiveDate: "2026-06-01",
      appliedAt: "2026-05-26T10:00:00.000Z",
      payload: {
        annualRateBps: 925
      }
    };

    const firstEffectiveDate: LoanEvent = {
      ...baseEvent,
      id: "6d6123f3-2d94-4d97-85f5-eddd080204d5",
      type: "DISBURSEMENT",
      effectiveDate: "2026-05-01",
      appliedAt: "2026-05-26T10:20:00.000Z",
      payload: {
        amountCents: 1_000_000
      }
    };

    expect(sortLoanEvents([laterApplied, earlierApplied, firstEffectiveDate])).toEqual([
      firstEffectiveDate,
      earlierApplied,
      laterApplied
    ]);
  });

  it("validates event payloads before sorting", () => {
    expect(() =>
      validateAndSortLoanEvents([
        {
          ...baseEvent,
          id: "not-a-uuid",
          type: "DISBURSEMENT",
          effectiveDate: "2026-05-01",
          appliedAt: "2026-05-26T10:20:00.000Z",
          payload: {
            amountCents: 1_000_000
          }
        }
      ])
    ).toThrow();
  });
});
