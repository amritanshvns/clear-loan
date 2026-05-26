import { del, get, set } from "idb-keyval";

export type PrepaymentStrategy = "REDUCE_EMI" | "REDUCE_TENURE";

export interface LoanDraft {
  principal: string;
  annualRate: string;
  emi: string;
  startDate: string;
  firstEmiDate: string;
  prepaymentAmount: string;
  prepaymentDate: string;
  strategy: PrepaymentStrategy;
}

const STORAGE_KEY = "openloan.loan-draft.v1";

export async function loadLoanDraft(): Promise<LoanDraft | null> {
  const indexedDbValue = await readFromIndexedDb();

  if (indexedDbValue) {
    return indexedDbValue;
  }

  return readFromLocalStorage();
}

export async function saveLoanDraft(draft: LoanDraft): Promise<void> {
  await writeToIndexedDb(draft);
  writeToLocalStorage(draft);
}

export async function clearLoanDraft(): Promise<void> {
  await deleteFromIndexedDb();
  window.localStorage.removeItem(STORAGE_KEY);
}

async function readFromIndexedDb(): Promise<LoanDraft | null> {
  try {
    return normalizeLoanDraft(await get<unknown>(STORAGE_KEY));
  } catch {
    return null;
  }
}

async function writeToIndexedDb(draft: LoanDraft): Promise<void> {
  try {
    await set(STORAGE_KEY, draft);
  } catch {
    // localStorage remains available as a fallback on locked-down browsers.
  }
}

async function deleteFromIndexedDb(): Promise<void> {
  try {
    await del(STORAGE_KEY);
  } catch {
    // Clearing localStorage is still enough to reset the fallback path.
  }
}

function readFromLocalStorage(): LoanDraft | null {
  const serialized = window.localStorage.getItem(STORAGE_KEY);

  if (!serialized) {
    return null;
  }

  try {
    return normalizeLoanDraft(JSON.parse(serialized));
  } catch {
    return null;
  }
}

function writeToLocalStorage(draft: LoanDraft): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function normalizeLoanDraft(value: unknown): LoanDraft | null {
  if (!isObject(value)) {
    return null;
  }

  const strategy = value.strategy === "REDUCE_EMI" ? "REDUCE_EMI" : "REDUCE_TENURE";

  return {
    principal: readString(value.principal),
    annualRate: readString(value.annualRate),
    emi: readString(value.emi),
    startDate: readString(value.startDate),
    firstEmiDate: readString(value.firstEmiDate),
    prepaymentAmount: readString(value.prepaymentAmount),
    prepaymentDate: readString(value.prepaymentDate),
    strategy
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
