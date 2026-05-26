export const LOAN_EVENT_SCHEMA_VERSION = "1.0" as const;

export type LoanEventSchemaVersion = typeof LOAN_EVENT_SCHEMA_VERSION;

export type LoanEventType =
  | "DISBURSEMENT"
  | "EMI"
  | "PREPAYMENT"
  | "RATE_CHANGE";

export interface BaseLoanEvent {
  id: string;
  schemaVersion: LoanEventSchemaVersion;
  type: LoanEventType;
  effectiveDate: string;
  appliedAt: string;
  metadata?: Record<string, string>;
}

export interface DisbursementEvent extends BaseLoanEvent {
  type: "DISBURSEMENT";
  payload: {
    amountCents: number;
  };
}

export interface EMIEvent extends BaseLoanEvent {
  type: "EMI";
  payload: {
    amountCents: number;
  };
}

export interface PrepaymentEvent extends BaseLoanEvent {
  type: "PREPAYMENT";
  payload: {
    amountCents: number;
    strategy: "REDUCE_EMI" | "REDUCE_TENURE";
  };
}

export interface RateChangeEvent extends BaseLoanEvent {
  type: "RATE_CHANGE";
  payload: {
    annualRateBps: number;
  };
}

export type LoanEvent =
  | DisbursementEvent
  | EMIEvent
  | PrepaymentEvent
  | RateChangeEvent;
