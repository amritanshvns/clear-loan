import { describe, expect, it } from "vitest";
import type { LoanEvent } from "../events/types";
import { LoanMathError } from "./errors";
import { reduceLoanEvents } from "./ledger";

const disbursement: LoanEvent = {
  id: "45f67928-4e42-42c0-a52c-61a10b525fc1",
  schemaVersion: "1.0",
  type: "DISBURSEMENT",
  effectiveDate: "2026-01-01",
  appliedAt: "2026-01-01T00:00:00.000Z",
  payload: {
    amountCents: 100_000
  }
};

const rateChange: LoanEvent = {
  id: "dc01313f-d887-4c4c-a24e-c5ddcb635508",
  schemaVersion: "1.0",
  type: "RATE_CHANGE",
  effectiveDate: "2026-01-01",
  appliedAt: "2026-01-01T00:01:00.000Z",
  payload: {
    annualRateBps: 1_200
  }
};

describe("reduceLoanEvents", () => {
  it("accrues interest between ordered events", () => {
    const emi: LoanEvent = {
      id: "0ba58f3c-bb42-438d-a081-e32b7648e953",
      schemaVersion: "1.0",
      type: "EMI",
      effectiveDate: "2026-02-01",
      appliedAt: "2026-02-01T00:00:00.000Z",
      payload: {
        amountCents: 5_000
      }
    };

    const result = reduceLoanEvents([emi, rateChange, disbursement]);

    expect(result.entries).toHaveLength(3);
    expect(result.entries[2]?.daysSincePreviousEvent).toBe(31);
    expect(result.entries[2]?.interestAccruedCents).toBe(1_019);
    expect(result.finalState).toEqual({
      principalCents: 96_019,
      accruedInterestCents: 0,
      annualRateBps: 1_200,
      asOfDate: "2026-02-01"
    });
  });

  it("applies prepayments directly to principal", () => {
    const prepayment: LoanEvent = {
      id: "cab80680-8910-4293-b41a-fb90514dc1b2",
      schemaVersion: "1.0",
      type: "PREPAYMENT",
      effectiveDate: "2026-01-10",
      appliedAt: "2026-01-10T00:00:00.000Z",
      payload: {
        amountCents: 25_000,
        strategy: "REDUCE_TENURE"
      }
    };

    const result = reduceLoanEvents([disbursement, prepayment]);

    expect(result.finalState.principalCents).toBe(75_000);
  });

  it("rejects prepayments that would make principal negative", () => {
    const prepayment: LoanEvent = {
      id: "7a442d23-e052-420a-a1d8-1a31990f173d",
      schemaVersion: "1.0",
      type: "PREPAYMENT",
      effectiveDate: "2026-01-10",
      appliedAt: "2026-01-10T00:00:00.000Z",
      payload: {
        amountCents: 125_000,
        strategy: "REDUCE_EMI"
      }
    };

    expect(() => reduceLoanEvents([disbursement, prepayment])).toThrow(LoanMathError);
  });
});
