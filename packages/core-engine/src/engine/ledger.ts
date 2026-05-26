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
  periodStartDate: string;
  periodEndDate: string;
  daysSincePreviousEvent: number;
  interestAccruedCents: number;
  openingState: LedgerState;
  paymentCents: number;
  interestPaidCents: number;
  principalPaidCents: number;
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
    const openingState = accrual.state;
    const transaction = applyLoanEvent(openingState, event);
    state = transaction.state;

    entries.push({
      event,
      periodStartDate: accrual.periodStartDate,
      periodEndDate: event.effectiveDate,
      daysSincePreviousEvent: accrual.days,
      interestAccruedCents: accrual.interestCents,
      openingState,
      paymentCents: transaction.paymentCents,
      interestPaidCents: transaction.interestPaidCents,
      principalPaidCents: transaction.principalPaidCents,
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
): { state: LedgerState; periodStartDate: string; days: number; interestCents: number } {
  if (state.asOfDate === null) {
    return {
      state: {
        ...state,
        asOfDate: effectiveDate
      },
      periodStartDate: effectiveDate,
      days: 0,
      interestCents: 0
    };
  }

  const periodStartDate = state.asOfDate;
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
    periodStartDate,
    days,
    interestCents
  };
}

interface AppliedLoanEvent {
  state: LedgerState;
  paymentCents: number;
  interestPaidCents: number;
  principalPaidCents: number;
}

function applyLoanEvent(state: LedgerState, event: LoanEvent): AppliedLoanEvent {
  switch (event.type) {
    case "DISBURSEMENT": {
      return {
        state: {
          ...state,
          principalCents: state.principalCents + event.payload.amountCents
        },
        paymentCents: 0,
        interestPaidCents: 0,
        principalPaidCents: 0
      };
    }

    case "RATE_CHANGE": {
      return {
        state: {
          ...state,
          annualRateBps: event.payload.annualRateBps
        },
        paymentCents: 0,
        interestPaidCents: 0,
        principalPaidCents: 0
      };
    }

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
): AppliedLoanEvent {
  if (paymentCents > state.principalCents) {
    throw new LoanMathError(
      "Prepayment cannot exceed outstanding principal",
      "NEGATIVE_BALANCE",
      eventId
    );
  }

  return {
    state: {
      ...state,
      principalCents: state.principalCents - paymentCents
    },
    paymentCents,
    interestPaidCents: 0,
    principalPaidCents: paymentCents
  };
}

function applyEmiPayment(state: LedgerState, paymentCents: number, eventId: string): AppliedLoanEvent {
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
    state: {
      ...state,
      accruedInterestCents: state.accruedInterestCents - interestPaidCents,
      principalCents: state.principalCents - principalPaidCents
    },
    paymentCents,
    interestPaidCents,
    principalPaidCents
  };
}
