# OpenLoan - AI-First Product Requirements Document (PRD)

## Overview

OpenLoan is a free, open-source, privacy-first loan calculation and simulation platform focused on correctness, transparency, and real-world loan scenarios.

The platform is designed specifically for:

- Floating interest rate loans
- Arbitrary prepayments
- Exact date-based amortization
- Explainable calculations
- Local-only persistence
- Offline-first usage

The entire application runs in-browser with no backend infrastructure.

---

## Product Vision

Build a trustworthy and mathematically accurate loan engine that:

- Works completely offline
- Stores all data locally on the user's device
- Supports real-world loan behaviors ignored by most calculators
- Remains permanently free to host and use
- Is fully auditable and open source
- Can be extended by community contributors

The project prioritizes:

1. Correctness
2. Transparency
3. Explainability
4. Ease of use
5. Performance
6. Minimal UX

---

## Core Philosophy

### Privacy First

The application must:

- Have no backend
- Require no authentication
- Collect no telemetry
- Send no financial data externally
- Support complete offline functionality

All calculations occur locally in the browser. User data remains entirely under user control.

---

### Event-Driven Architecture

The system must treat every loan modification as an immutable event.

Supported events:

```json
[
  "DISBURSEMENT",
  "EMI",
  "PREPAYMENT",
  "RATE_CHANGE",
  "FEE",
  "MORATORIUM",
  "MANUAL_ADJUSTMENT"
]
```

The amortization schedule is derived entirely from ordered events. No hidden state. No spreadsheet-style implicit calculations.

### Explainability

Every calculated number must be explainable.

Examples:

- Why EMI changed
- Why interest increased
- Impact of floating rates
- Impact of prepayments
- Exact interest period calculations

The system must display:

- Formulas used
- Principal amount
- Rate applied
- Exact date range
- Day count used
- Resulting values

---

## Technical Direction

### Architecture

The platform must be:

- Frontend-only
- Static hosted
- JSON driven
- Deterministic
- Testable
- Modular

Recommended architecture:

```plaintext
packages/
  core-engine/
  web-ui/
  parsers/
```

### Core Event Schema

Every event in the system must conform to a strict schema with explicit versioning. The engine relies on this for idempotency and ordering.

```typescript
interface BaseLoanEvent {
  id: string;             // UUID v4
  schemaVersion: "1.0";   // For backward-compatible parsing
  type: LoanEventType;    // e.g., "PREPAYMENT", "RATE_CHANGE"
  effectiveDate: string;  // ISO 8601 YYYY-MM-DD
  appliedAt: string;      // ISO 8601 timestamp of creation
  metadata?: Record<string, string>; // Optional context, e.g., "Annual bonus"
}

interface PrepaymentEvent extends BaseLoanEvent {
  type: "PREPAYMENT";
  payload: {
    amount: number;
    strategy: "REDUCE_EMI" | "REDUCE_TENURE";
  };
}
```

### Ordering Rules

The core reducer must strictly sort events by `effectiveDate` ascending, breaking ties using `appliedAt` ascending, before calculating the amortization schedule.

### Recommended Technology Stack

Frontend:

- React
- TypeScript
- Vite

State management:

- Zustand

Validation:

- zod

Date utilities:

- date-fns

Table rendering:

- TanStack Table

Charts:

- Recharts

Local persistence:

- IndexedDB
- localStorage fallback

---

## Core Engine Requirements

### Deterministic Calculations

The loan engine must:

- Use pure functions
- Avoid hidden state
- Support reproducible outputs
- Avoid UI coupling
- Remain independently testable

### Interest Calculation Requirements

The engine must support:

- Daily reducing balance
- Monthly reducing balance
- Exact date arithmetic
- Floating interest rates
- Arbitrary payment dates
- Leap year handling

Core interest formula:

```plaintext
Interest = Principal * Rate * Days / 365
```

### Floating Interest Rate & Prepayment Support

The engine must support arbitrary interest rate changes, historical rate tracking, arbitrary prepayment dates, partial prepayments, and lump-sum reductions using either reducing tenure or reducing EMI.

---

## UX Philosophy & Structure

The application should prioritize clarity, speed, simplicity, and usability. Avoid dashboard clutter, unnecessary animations, and dark patterns.

### Progressive Disclosure

The UI must default to the simplest possible view. Advanced financial variables should be hidden behind "Advanced Settings" toggles to avoid overwhelming standard users.

Default mode assumes standard day-count conventions (Actual/365), standard EMI dates (1st or 5th of the month), and uniform payment periods.

Advanced mode reveals inputs for custom day-count conventions, such as 30/360, custom effective dates for rate changes, and irregular first-EMI periods.

### Engine Validation & UI Error States

The core engine will reject events that result in invalid mathematical states. The UI must handle these gracefully without blocking the user's exploratory workflow.

Non-blocking errors:

- If a user inputs a simulation parameter that breaks the loan, the UI must not crash.

Warning banners:

- The schedule view should render up to the point of failure, highlight the exact row where the math breaks, such as "Balance below zero", and display a clear, explainable warning banner.

---

## Offline Support & Persistence

The application must function fully offline as a Progressive Web App (PWA).

Persistence must remain entirely under user control via JSON export/import and IndexedDB.

---

## AI-Assisted Development Requirements & Guardrails

AI-generated code must:

- Use TypeScript strictly
- Avoid side effects
- Avoid giant files/components
- Include comments for financial logic
- Include tests for calculations
- Avoid duplicate business logic

AI must never invent finance formulas or mix UI and engine logic.

---

## Testing Requirements

### Coverage Target

Core engine calculation logic should have greater than 90% test coverage.

### Property-Based Testing

In addition to standard unit tests and golden datasets, the core engine must use property-based testing, via libraries like fast-check. The test suite must generate thousands of random combinations of disbursements, prepayments, and rate changes to ensure core invariants are never broken.

Strict invariants:

- Outstanding principal must never drop below exactly 0.00.
- Interest components must never be negative.
- The sum of all principal components across the schedule must exactly equal the total disbursed amount.

---

## MVP Scope

### Included

- Loan creation
- Floating rate handling
- Arbitrary prepayments
- Amortization schedule generation
- Local-only persistence
- JSON import/export
- Offline support
- Simulation engine

### Excluded

- Backend
- Authentication
- Cloud sync
- Notifications
- AI chatbot
- Banking integrations
