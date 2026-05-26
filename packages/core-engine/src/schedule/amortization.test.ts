import { describe, expect, it } from "vitest";
import type { LoanEvent } from "../events/types";
import { generateAmortizationSchedule } from "./amortization";

describe("generateAmortizationSchedule", () => {
  it("maps ledger entries into explainable schedule rows", () => {
    const events: LoanEvent[] = [
      {
        id: "45f67928-4e42-42c0-a52c-61a10b525fc1",
        schemaVersion: "1.0",
        type: "DISBURSEMENT",
        effectiveDate: "2026-01-01",
        appliedAt: "2026-01-01T00:00:00.000Z",
        payload: {
          amountCents: 100_000
        }
      },
      {
        id: "dc01313f-d887-4c4c-a24e-c5ddcb635508",
        schemaVersion: "1.0",
        type: "RATE_CHANGE",
        effectiveDate: "2026-01-01",
        appliedAt: "2026-01-01T00:01:00.000Z",
        payload: {
          annualRateBps: 1_200
        }
      },
      {
        id: "0ba58f3c-bb42-438d-a081-e32b7648e953",
        schemaVersion: "1.0",
        type: "EMI",
        effectiveDate: "2026-02-01",
        appliedAt: "2026-02-01T00:00:00.000Z",
        payload: {
          amountCents: 5_000
        }
      }
    ];

    const schedule = generateAmortizationSchedule(events);

    expect(schedule.rows).toHaveLength(3);
    expect(schedule.rows[2]).toMatchObject({
      eventType: "EMI",
      periodStartDate: "2026-01-01",
      periodEndDate: "2026-02-01",
      days: 31,
      openingPrincipalCents: 100_000,
      interestAccruedCents: 1_019,
      interestPaidCents: 1_019,
      principalPaidCents: 3_981,
      paymentCents: 5_000,
      closingPrincipalCents: 96_019,
      accruedInterestBalanceCents: 0
    });
    expect(schedule.rows[2]?.explanation).toEqual({
      formula: "Interest = Principal * Rate * Days / 365",
      principalCents: 100_000,
      annualRateBps: 1_200,
      days: 31
    });
  });

  it("summarizes disbursement, payment, interest, and principal totals", () => {
    const events: LoanEvent[] = [
      {
        id: "45f67928-4e42-42c0-a52c-61a10b525fc1",
        schemaVersion: "1.0",
        type: "DISBURSEMENT",
        effectiveDate: "2026-01-01",
        appliedAt: "2026-01-01T00:00:00.000Z",
        payload: {
          amountCents: 100_000
        }
      },
      {
        id: "dc01313f-d887-4c4c-a24e-c5ddcb635508",
        schemaVersion: "1.0",
        type: "RATE_CHANGE",
        effectiveDate: "2026-01-01",
        appliedAt: "2026-01-01T00:01:00.000Z",
        payload: {
          annualRateBps: 1_200
        }
      },
      {
        id: "0ba58f3c-bb42-438d-a081-e32b7648e953",
        schemaVersion: "1.0",
        type: "EMI",
        effectiveDate: "2026-02-01",
        appliedAt: "2026-02-01T00:00:00.000Z",
        payload: {
          amountCents: 5_000
        }
      }
    ];

    expect(generateAmortizationSchedule(events).totals).toEqual({
      disbursedCents: 100_000,
      paymentCents: 5_000,
      interestAccruedCents: 1_019,
      interestPaidCents: 1_019,
      principalPaidCents: 3_981
    });
  });
});
