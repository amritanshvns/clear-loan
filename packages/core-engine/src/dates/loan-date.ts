import { differenceInCalendarDays, isValid, parseISO } from "date-fns";

export function parseLoanDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("Loan dates must use YYYY-MM-DD format");
  }

  const parsed = parseISO(value);

  if (!isValid(parsed)) {
    throw new TypeError(`Invalid loan date: ${value}`);
  }

  return parsed;
}

export function daysBetweenLoanDates(startDate: string, endDate: string): number {
  const start = parseLoanDate(startDate);
  const end = parseLoanDate(endDate);
  const days = differenceInCalendarDays(end, start);

  if (days < 0) {
    throw new RangeError("endDate must be on or after startDate");
  }

  return days;
}
