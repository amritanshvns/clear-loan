import { describe, expect, it } from "vitest";
import { daysBetweenLoanDates, parseLoanDate } from "./loan-date";

describe("loan date utilities", () => {
  it("counts calendar days across a leap day", () => {
    expect(daysBetweenLoanDates("2024-02-28", "2024-03-01")).toBe(2);
  });

  it("counts same-day periods as zero days", () => {
    expect(daysBetweenLoanDates("2026-05-26", "2026-05-26")).toBe(0);
  });

  it("rejects non-ISO loan dates", () => {
    expect(() => parseLoanDate("26-05-2026")).toThrow("YYYY-MM-DD");
  });

  it("rejects reversed date ranges", () => {
    expect(() => daysBetweenLoanDates("2026-05-27", "2026-05-26")).toThrow(
      "endDate must be on or after startDate"
    );
  });
});
