import { z } from "zod";
import { LOAN_EVENT_SCHEMA_VERSION } from "./types";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

const baseEventSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.literal(LOAN_EVENT_SCHEMA_VERSION),
  effectiveDate: isoDateSchema,
  appliedAt: z.string().datetime({ offset: true }),
  metadata: z.record(z.string()).optional()
});

const positiveCentsSchema = z.number().int().positive();
const nonNegativeBpsSchema = z.number().int().min(0);

export const disbursementEventSchema = baseEventSchema.extend({
  type: z.literal("DISBURSEMENT"),
  payload: z.object({
    amountCents: positiveCentsSchema
  })
});

export const emiEventSchema = baseEventSchema.extend({
  type: z.literal("EMI"),
  payload: z.object({
    amountCents: positiveCentsSchema
  })
});

export const prepaymentEventSchema = baseEventSchema.extend({
  type: z.literal("PREPAYMENT"),
  payload: z.object({
    amountCents: positiveCentsSchema,
    strategy: z.enum(["REDUCE_EMI", "REDUCE_TENURE"])
  })
});

export const rateChangeEventSchema = baseEventSchema.extend({
  type: z.literal("RATE_CHANGE"),
  payload: z.object({
    annualRateBps: nonNegativeBpsSchema
  })
});

export const loanEventSchema = z.discriminatedUnion("type", [
  disbursementEventSchema,
  emiEventSchema,
  prepaymentEventSchema,
  rateChangeEventSchema
]);

export const loanEventArraySchema = z.array(loanEventSchema);

export type ParsedLoanEvent = z.infer<typeof loanEventSchema>;
