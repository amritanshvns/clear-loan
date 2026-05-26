import { create } from "zustand";
import { dollarsToCents, type LoanEvent } from "@openloan/core-engine";
import {
  clearLoanDraft,
  loadLoanDraft,
  saveLoanDraft,
  type LoanDraft
} from "../persistence/loanDraftStorage";

export const defaultLoanDraft: LoanDraft = {
  principal: "5000000",
  annualRate: "8.75",
  emi: "42500",
  startDate: "2026-06-01",
  firstEmiDate: "2026-07-01",
  prepaymentAmount: "250000",
  prepaymentDate: "2026-12-01",
  strategy: "REDUCE_TENURE"
};

interface LoanStore {
  draft: LoanDraft;
  events: LoanEvent[];
  isHydrated: boolean;
  updateDraft: (patch: Partial<LoanDraft>) => void;
  resetDraft: () => void;
  hydrate: () => Promise<void>;
}

export const useLoanStore = create<LoanStore>((set, get) => ({
  draft: defaultLoanDraft,
  events: buildEventsFromDraft(defaultLoanDraft),
  isHydrated: false,
  updateDraft: (patch) => {
    const draft = {
      ...get().draft,
      ...patch
    };

    set({
      draft,
      events: buildEventsFromDraft(draft)
    });

    void saveLoanDraft(draft);
  },
  resetDraft: () => {
    set({
      draft: defaultLoanDraft,
      events: buildEventsFromDraft(defaultLoanDraft)
    });

    void clearLoanDraft();
  },
  hydrate: async () => {
    const persistedDraft = await loadLoanDraft();
    const draft = persistedDraft ?? defaultLoanDraft;

    set({
      draft,
      events: buildEventsFromDraft(draft),
      isHydrated: true
    });
  }
}));

function buildEventsFromDraft(draft: LoanDraft): LoanEvent[] {
  const principalCents = dollarsToCents(parseAmount(draft.principal));
  const emiCents = dollarsToCents(parseAmount(draft.emi));
  const prepaymentCents = dollarsToCents(parseAmount(draft.prepaymentAmount));
  const annualRateBps = Math.round(parseAmount(draft.annualRate) * 100);

  return [
    {
      id: "11111111-1111-4111-8111-111111111111",
      schemaVersion: "1.0",
      type: "DISBURSEMENT",
      effectiveDate: draft.startDate,
      appliedAt: `${draft.startDate}T00:00:00.000Z`,
      payload: {
        amountCents: principalCents
      }
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      schemaVersion: "1.0",
      type: "RATE_CHANGE",
      effectiveDate: draft.startDate,
      appliedAt: `${draft.startDate}T00:01:00.000Z`,
      payload: {
        annualRateBps
      }
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      schemaVersion: "1.0",
      type: "EMI",
      effectiveDate: draft.firstEmiDate,
      appliedAt: `${draft.firstEmiDate}T00:00:00.000Z`,
      payload: {
        amountCents: emiCents
      }
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      schemaVersion: "1.0",
      type: "PREPAYMENT",
      effectiveDate: draft.prepaymentDate,
      appliedAt: `${draft.prepaymentDate}T00:00:00.000Z`,
      payload: {
        amountCents: prepaymentCents,
        strategy: draft.strategy
      }
    }
  ];
}

function parseAmount(value: string): number {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
