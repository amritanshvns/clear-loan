import { loanEventArraySchema } from "./schemas";
import type { LoanEvent } from "./types";

export function validateLoanEvents(events: unknown): LoanEvent[] {
  return loanEventArraySchema.parse(events);
}

export function sortLoanEvents(events: readonly LoanEvent[]): LoanEvent[] {
  return [...events].sort((left, right) => {
    const effectiveDateComparison = left.effectiveDate.localeCompare(right.effectiveDate);

    if (effectiveDateComparison !== 0) {
      return effectiveDateComparison;
    }

    return left.appliedAt.localeCompare(right.appliedAt);
  });
}

export function validateAndSortLoanEvents(events: unknown): LoanEvent[] {
  return sortLoanEvents(validateLoanEvents(events));
}
