import { daysBetweenLoanDates } from "../dates/loan-date";
import { sortLoanEvents } from "../events/order";
import type { LoanEvent } from "../events/types";
import { calculateActual365InterestCents } from "../math/interest";
import { LoanMathError } from "./errors";

export interface LedgerState {
  principalCents: number;
  accruedInterestCents: number;
  annualRateBps: number;
  asOfDate: string | null;
}

export interface LedgerEntry {
  event: LoanEvent;
  daysSincePreviousEvent: number;
  interestAccruedCents: number;
  state: LedgerState;
}

export interface ReduceLoanEventsResult {
  initialState: LedgerState;
  entries: LedgerEntry[];
  finalState: LedgerState;
}

const EMPTY_LEDGER_STATE: LedgerState = {
  principalCents: 0,
  accruedInterestCents: 0,
  annualRateBps: 0,
  asOfDate: null
};

export function reduceLoanEvents(events: readonly LoanEvent[]): ReduceLoanEventsResult {
  const orderedEvents = sortLoanEvents(events);
  const entries: LedgerEntry[] = [];
  let state: LedgerState = { ...EMPTY_LEDGER_STATE };

  for (const event of orderedEvents) {
    const accrual = accrueInterestUntil(state, event.effectiveDate);
    state = applyLoanEvent(accrual.state, event);

    entries.push({
      event,
      daysSincePreviousEvent: accrual.days,
      interestAccruedCents: accrual.interestCents,
      state
    });
  }

  return {
    initialState: { ...EMPTY_LEDGER_STATE },
    entries,
    finalState: state
  };
}

function accrueInterestUntil(
  state: LedgerState,
  effectiveDate: string
): { state: LedgerState; days: number; interestCents: number } {
  if (state.asOfDate === null) {
    return {
      state: {
        ...state,
        asOfDate: effectiveDate
      },
      days: 0,
      interestCents: 0
    };
  }

  const days = daysBetweenLoanDates(state.asOfDate, effectiveDate);
  const interestCents = calculateActual365InterestCents({
    principalCents: state.principalCents,
    annualRateBps: state.annualRateBps,
    days
  });

  return {
    state: {
      ...state,
      accruedInterestCents: state.accruedInterestCents + interestCents,
      asOfDate: effectiveDate
    },
    days,
    interestCents
  };
}

function applyLoanEvent(state: LedgerState, event: LoanEvent): LedgerState {
  switch (event.type) {
    case "DISBURSEMENT":
      return {
        ...state,
        principalCents: state.principalCents + event.payload.amountCents
      };

    case "RATE_CHANGE":
      return {
        ...state,
        annualRateBps: event.payload.annualRateBps
      };

    case "PREPAYMENT":
      return applyPrincipalPayment(state, event.payload.amountCents, event.id);

    case "EMI":
      return applyEmiPayment(state, event.payload.amountCents, event.id);
  }
}

function applyPrincipalPayment(
  state: LedgerState,
  paymentCents: number,
  eventId: string
): LedgerState {
  if (paymentCents > state.principalCents) {
    throw new LoanMathError(
      "Prepayment cannot exceed outstanding principal",
      "NEGATIVE_BALANCE",
      eventId
    );
  }

  return {
    ...state,
    principalCents: state.principalCents - paymentCents
  };
}

function applyEmiPayment(state: LedgerState, paymentCents: number, eventId: string): LedgerState {
  const totalOutstandingCents = state.principalCents + state.accruedInterestCents;

  if (totalOutstandingCents === 0) {
    throw new LoanMathError("EMI cannot be applied before disbursement", "MISSING_DISBURSEMENT", eventId);
  }

  if (paymentCents > totalOutstandingCents) {
    throw new LoanMathError("EMI cannot exceed total outstanding balance", "NEGATIVE_BALANCE", eventId);
  }

  // EMI payments clear accrued interest first, then reduce principal.
  const interestPaidCents = Math.min(paymentCents, state.accruedInterestCents);
  const principalPaidCents = paymentCents - interestPaidCents;

  return {
    ...state,
    accruedInterestCents: state.accruedInterestCents - interestPaidCents,
    principalCents: state.principalCents - principalPaidCents
  };
}
