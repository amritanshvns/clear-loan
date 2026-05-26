export type Cents = number;
export type BasisPoints = number;

export function dollarsToCents(amount: number): Cents {
  assertFiniteNumber(amount, "amount");
  return Math.round(amount * 100);
}

export function centsToDollars(amountCents: Cents): number {
  assertInteger(amountCents, "amountCents");
  return amountCents / 100;
}

export function addCents(left: Cents, right: Cents): Cents {
  assertInteger(left, "left");
  assertInteger(right, "right");
  return left + right;
}

export function subtractCents(left: Cents, right: Cents): Cents {
  assertInteger(left, "left");
  assertInteger(right, "right");
  return left - right;
}

export function assertNonNegativeCents(amountCents: Cents, fieldName = "amountCents"): void {
  assertInteger(amountCents, fieldName);

  if (amountCents < 0) {
    throw new RangeError(`${fieldName} must be non-negative`);
  }
}

export function assertPositiveCents(amountCents: Cents, fieldName = "amountCents"): void {
  assertInteger(amountCents, fieldName);

  if (amountCents <= 0) {
    throw new RangeError(`${fieldName} must be positive`);
  }
}

function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${fieldName} must be a finite number`);
  }
}

function assertInteger(value: number, fieldName: string): void {
  assertFiniteNumber(value, fieldName);

  if (!Number.isInteger(value)) {
    throw new TypeError(`${fieldName} must be an integer`);
  }
}
