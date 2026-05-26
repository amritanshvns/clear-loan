export class LoanMathError extends Error {
  constructor(
    message: string,
    readonly code: "NEGATIVE_BALANCE" | "MISSING_DISBURSEMENT",
    readonly eventId?: string
  ) {
    super(message);
    this.name = "LoanMathError";
  }
}
