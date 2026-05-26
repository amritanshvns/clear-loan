# OpenLoan - Technical Design Document (TDD)

## 1. System Overview

OpenLoan is a client-side only, offline-first web application. The core architectural pattern is **Event Sourcing**.

Instead of storing the current state of a loan, such as current balance or current EMI, the application stores a sequence of immutable events, such as disbursement, rate change, and prepayment events. The current state and the amortization schedule are always computed dynamically by reducing these events.

## 2. Package Architecture

The repository will be structured as a monorepo to strictly separate business logic from the UI.

- `@openloan/core-engine`: Pure TypeScript package containing financial math, date utilities, event schemas, and the state reducer. Zero dependencies on DOM or React.
- `@openloan/web-ui`: React application that consumes the core engine, handles user inputs, and renders the data.

## 3. Data Flow & Event Sourcing

### 3.1 The Event Store

The single source of truth is an array of `LoanEvent` objects.

```typescript
type LoanEvent =
  | DisbursementEvent
  | EMIEvent
  | PrepaymentEvent
  | RateChangeEvent;
```

### 3.2 The Reducer Pipeline

To generate a schedule, the engine runs the event stream through a pipeline:

1. Validation and sorting: Events are sorted by `effectiveDate` and validated against schemas using Zod.
2. State reduction: A reducer function iterates through time, daily or monthly depending on loan type, applying events to a `LedgerState` accumulator.
3. Schedule generation: The resulting state changes are mapped to rows representing payment periods in an `AmortizationSchedule`.

## 4. State Management (`web-ui`)

We will use Zustand for global state.

```typescript
interface LoanStore {
  events: LoanEvent[];
  addEvent: (event: LoanEvent) => void;
  removeEvent: (id: string) => void;
  derivedSchedule: AmortizationSchedule; // Computed automatically when events change
}
```

## 5. Persistence Strategy

Given the offline-first requirement, persistence is handled entirely on the client.

- Primary storage: IndexedDB via a lightweight wrapper, such as idb-keyval. This stores the raw event arrays.
- Portability: Users can export their entire IndexedDB state to a local `.json` file. This acts as their backup and sharing mechanism.
- No backend: There is no database, no API, and no authentication.

## 6. Offline Support (PWA)

The application will use vite-plugin-pwa to generate a service worker.

- Strategy: Cache-first for static assets, including HTML, JavaScript, CSS, and fonts.
- Manifest: Web App Manifest provided for installability on desktop and mobile.

## 7. Math & Precision Considerations

Avoid floating-point arithmetic errors for currency by using integer cents internally, such as `$10.50 -> 1050`, or use a lightweight decimal library if integer math becomes too complex for arbitrary percentage rates.

Date math will exclusively use date-fns to ensure leap year and time-zone agnostic daily differences are calculated consistently.
