import type { LoanEventType } from "../events/types";
import { reduceLoanEvents, type LedgerEntry } from "../engine/ledger";
import type { LoanEvent } from "../events/types";

export interface AmortizationScheduleRow {
  rowId: string;
  eventId: string;
  eventType: LoanEventType;
  periodStartDate: string;
  periodEndDate: string;
  days: number;
  annualRateBps: number;
  openingPrincipalCents: number;
  interestAccruedCents: number;
  interestPaidCents: number;
  principalPaidCents: number;
  paymentCents: number;
  closingPrincipalCents: number;
  accruedInterestBalanceCents: number;
  explanation: {
    formula: "Interest = Principal * Rate * Days / 365";
    principalCents: number;
    annualRateBps: number;
    days: number;
  };
}

export interface AmortizationSchedule {
  rows: AmortizationScheduleRow[];
  totals: {
    disbursedCents: number;
    paymentCents: number;
    interestAccruedCents: number;
    interestPaidCents: number;
    principalPaidCents: number;
  };
}

export function generateAmortizationSchedule(events: readonly LoanEvent[]): AmortizationSchedule {
  const ledger = reduceLoanEvents(events);
  const rows = ledger.entries.map(toScheduleRow);

  return {
    rows,
    totals: rows.reduce(
      (totals, row) => ({
        disbursedCents:
          totals.disbursedCents +
          (row.eventType === "DISBURSEMENT" ? row.closingPrincipalCents - row.openingPrincipalCents : 0),
        paymentCents: totals.paymentCents + row.paymentCents,
        interestAccruedCents: totals.interestAccruedCents + row.interestAccruedCents,
        interestPaidCents: totals.interestPaidCents + row.interestPaidCents,
        principalPaidCents: totals.principalPaidCents + row.principalPaidCents
      }),
      {
        disbursedCents: 0,
        paymentCents: 0,
        interestAccruedCents: 0,
        interestPaidCents: 0,
        principalPaidCents: 0
      }
    )
  };
}

function toScheduleRow(entry: LedgerEntry, index: number): AmortizationScheduleRow {
  return {
    rowId: `${String(index + 1).padStart(6, "0")}-${entry.event.id}`,
    eventId: entry.event.id,
    eventType: entry.event.type,
    periodStartDate: entry.periodStartDate,
    periodEndDate: entry.periodEndDate,
    days: entry.daysSincePreviousEvent,
    annualRateBps: entry.openingState.annualRateBps,
    openingPrincipalCents: entry.openingState.principalCents,
    interestAccruedCents: entry.interestAccruedCents,
    interestPaidCents: entry.interestPaidCents,
    principalPaidCents: entry.principalPaidCents,
    paymentCents: entry.paymentCents,
    closingPrincipalCents: entry.state.principalCents,
    accruedInterestBalanceCents: entry.state.accruedInterestCents,
    explanation: {
      formula: "Interest = Principal * Rate * Days / 365",
      principalCents: entry.openingState.principalCents,
      annualRateBps: entry.openingState.annualRateBps,
      days: entry.daysSincePreviousEvent
    }
  };
}
