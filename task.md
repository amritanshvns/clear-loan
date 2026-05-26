# OpenLoan - Implementation Plan & Backlog

This document outlines the execution backlog to take OpenLoan from a PRD to a live product, structured by architectural epics.

## Epic 1: Repository Architecture & Core Engine

Focus entirely on the headless mathematical engine. No UI work happens here.

| Status          | Task       | Description            | Acceptance Criteria                                                                                                                 |
| :-------------- | :--------- | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| Done            | **ENG-01** | Initialize Monorepo    | Set up Turborepo or npm workspaces with `packages/core-engine` and `packages/web-ui`. Enforce strict TypeScript rules.              |
| Done            | **ENG-02** | Define Event Schemas   | Implement Zod schemas and TypeScript interfaces for all events (`DISBURSEMENT`, `PREPAYMENT`, `RATE_CHANGE`) with strict schema versioning. |
| Done            | **ENG-03** | Core Math Utilities    | Write pure functions for exact-date interest calculation using `date-fns`. Must handle leap years and partial months.               |
| Done            | **ENG-04** | The State Reducer      | Build the core event processor. It must ingest an ordered array of events and output a raw timeline of financial state changes.      |
| Done            | **ENG-05** | Amortization Generator | Map the raw state timeline into the final `AmortizationSchedule` object required by the UI.                                         |

## Epic 2: Engine Validation & Testing Pipeline

Guarantee the mathematical correctness before any user ever touches the interface.

| Status          | Task       | Description             | Acceptance Criteria                                                                                                            |
| :-------------- | :--------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| Not Started     | **TST-01** | Golden Dataset Setup    | Create `golden-datasets/` directory. Manually map 5 known, complex loan schedules into JSON expected outputs.                  |
| Done            | **TST-02** | Unit Test Coverage      | Write Jest/Vitest suites for all pure functions in `ENG-03`. Target >90% coverage for calculation logic.                       |
| Not Started     | **TST-03** | Property-Based Testing  | Integrate `fast-check` to blast the engine with randomized events. Assert invariants, such as principal never dropping below zero. |
| Partial         | **TST-04** | Engine Validation Rules | Implement internal checks that throw typed errors for mathematically impossible states, such as over-payment.                   |

## Epic 3: Data Persistence & State Management

Bridge the gap between the headless engine and the browser environment.

| Status          | Task       | Description        | Acceptance Criteria                                                                                                   |
| :-------------- | :--------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------- |
| Partial         | **DAT-01** | IndexedDB Adapter  | Implement local storage layer for saving and loading the array of loan events.                                        |
| Not Started     | **DAT-02** | JSON Import/Export | Build utility to serialize the IndexedDB state to a downloadable JSON file, and parse uploaded files back into state. |
| Done            | **DAT-03** | Zustand Store      | Create the global state manager in `web-ui` to hold the current events and the derived `AmortizationSchedule`.        |

## Epic 4: UI Development & Progressive Disclosure

Build the frontend, ensuring advanced features do not clutter the default experience.

| Status          | Task      | Description            | Acceptance Criteria                                                                                                             |
| :-------------- | :-------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| Partial         | **UI-01** | Base Application Shell | Set up React, Vite, and primary routing/navigation for Dashboard, Schedule, and Simulations.                                    |
| Partial         | **UI-02** | Loan Creation Flow     | Build the default input form. Hide custom day-count conventions and irregular start dates behind an "Advanced Settings" toggle. |
| Partial         | **UI-03** | Event Ledger View      | Create a timeline component showing all applied events, such as rate changes and prepayments, with options to edit/delete.      |
| Partial         | **UI-04** | Amortization Table     | Implement TanStack Table to render the schedule. Must support CSV export and sticky headers for scannability.                   |
| Done            | **UI-05** | Non-Blocking Error UI  | Build warning banners that render within the schedule table if the engine hits an invalid state during a simulation.            |

## Epic 5: Simulation & Offline Infrastructure

Finalize the offline-first requirement and add the simulation layer.

| Status          | Task       | Description             | Acceptance Criteria                                                                                                       |
| :-------------- | :--------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| Not Started     | **SIM-01** | Simulation Sandboxing   | Allow the UI to clone the Zustand state, apply hypothetical events, and render a comparative summary without saving.      |
| Not Started     | **PWA-01** | Service Worker Setup    | Configure Vite PWA plugin to cache all static assets.                                                                     |
| Not Started     | **PWA-02** | Offline Audit           | Verify the application can load completely without a network connection, parse a JSON import, and recalculate a schedule. |
| Not Started     | **REL-01** | GitHub Pages Deployment | Configure GitHub Actions to build the static site and deploy directly to the `gh-pages` branch on merge to `main`.        |
