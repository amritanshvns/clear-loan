import {
  CalendarClock,
  Database,
  IndianRupee,
  Landmark,
  Percent,
  Plus,
  RefreshCw,
  ShieldCheck,
  TableProperties
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  dollarsToCents,
  generateAmortizationSchedule,
  type AmortizationSchedule,
  type LoanEvent
} from "@openloan/core-engine";

type Strategy = "REDUCE_EMI" | "REDUCE_TENURE";

interface LoanFormState {
  principal: string;
  annualRate: string;
  emi: string;
  startDate: string;
  firstEmiDate: string;
  prepaymentAmount: string;
  prepaymentDate: string;
  strategy: Strategy;
}

const initialForm: LoanFormState = {
  principal: "5000000",
  annualRate: "8.75",
  emi: "42500",
  startDate: "2026-06-01",
  firstEmiDate: "2026-07-01",
  prepaymentAmount: "250000",
  prepaymentDate: "2026-12-01",
  strategy: "REDUCE_TENURE"
};

export function App() {
  const [form, setForm] = useState<LoanFormState>(initialForm);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const events = useMemo(() => buildPreviewEvents(form), [form]);
  const preview = useMemo(() => buildSchedulePreview(events), [events]);
  const finalRow = preview.schedule.rows.at(-1);
  const totalOutstandingCents =
    (finalRow?.closingPrincipalCents ?? 0) + (finalRow?.accruedInterestBalanceCents ?? 0);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Loan controls">
        <div className="brand-block">
          <div className="brand-mark">
            <Landmark size={22} aria-hidden="true" />
          </div>
          <div>
            <h1>OpenLoan</h1>
            <p>Local loan simulation</p>
          </div>
        </div>

        <section className="panel input-panel" aria-labelledby="loan-inputs">
          <div className="panel-heading">
            <h2 id="loan-inputs">Loan Setup</h2>
            <button
              className="icon-button"
              type="button"
              title="Reset sample"
              aria-label="Reset sample"
              onClick={() => setForm(initialForm)}
            >
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="field-grid">
            <MoneyField
              label="Principal"
              value={form.principal}
              onChange={(principal) => setForm((current) => ({ ...current, principal }))}
            />
            <NumberField
              icon={<Percent size={17} aria-hidden="true" />}
              label="Annual rate"
              suffix="%"
              value={form.annualRate}
              onChange={(annualRate) => setForm((current) => ({ ...current, annualRate }))}
            />
            <MoneyField
              label="EMI"
              value={form.emi}
              onChange={(emi) => setForm((current) => ({ ...current, emi }))}
            />
            <DateField
              label="Disbursement"
              value={form.startDate}
              onChange={(startDate) => setForm((current) => ({ ...current, startDate }))}
            />
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={advancedOpen}
              onChange={(event) => setAdvancedOpen(event.target.checked)}
            />
            <span>Advanced settings</span>
          </label>

          {advancedOpen ? (
            <div className="advanced-grid">
              <DateField
                label="First EMI"
                value={form.firstEmiDate}
                onChange={(firstEmiDate) => setForm((current) => ({ ...current, firstEmiDate }))}
              />
              <MoneyField
                label="Prepayment"
                value={form.prepaymentAmount}
                onChange={(prepaymentAmount) =>
                  setForm((current) => ({ ...current, prepaymentAmount }))
                }
              />
              <DateField
                label="Prepay date"
                value={form.prepaymentDate}
                onChange={(prepaymentDate) => setForm((current) => ({ ...current, prepaymentDate }))}
              />
              <label className="input-field">
                <span>Strategy</span>
                <select
                  value={form.strategy}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, strategy: event.target.value as Strategy }))
                  }
                >
                  <option value="REDUCE_TENURE">Reduce tenure</option>
                  <option value="REDUCE_EMI">Reduce EMI</option>
                </select>
              </label>
            </div>
          ) : null}
        </section>

        <section className="panel ledger-panel" aria-labelledby="event-ledger">
          <div className="panel-heading">
            <h2 id="event-ledger">Event Ledger</h2>
            <button className="icon-button" type="button" title="Add event" aria-label="Add event">
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
          <ol className="event-list">
            {events.map((event) => (
              <li key={event.id}>
                <span>{formatEventType(event.type)}</span>
                <strong>{event.effectiveDate}</strong>
              </li>
            ))}
          </ol>
        </section>
      </aside>

      <section className="workspace" aria-label="Loan schedule preview">
        <header className="topbar">
          <div>
            <p className="eyebrow">Simulation Preview</p>
            <h2>Exact-date amortization</h2>
          </div>
          <div className="privacy-pill">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Local only</span>
          </div>
        </header>

        <section className="metric-grid" aria-label="Loan metrics">
          <Metric icon={<IndianRupee size={19} />} label="Disbursed" value={formatCurrency(preview.schedule.totals.disbursedCents)} />
          <Metric icon={<Database size={19} />} label="Outstanding" value={formatCurrency(totalOutstandingCents)} />
          <Metric icon={<Percent size={19} />} label="Interest accrued" value={formatCurrency(preview.schedule.totals.interestAccruedCents)} />
          <Metric icon={<CalendarClock size={19} />} label="Rows" value={String(preview.schedule.rows.length)} />
        </section>

        <section className="table-section" aria-labelledby="schedule-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ledger Derived</p>
              <h3 id="schedule-title">Amortization Schedule</h3>
            </div>
            <button className="text-button" type="button">
              <TableProperties size={18} aria-hidden="true" />
              CSV
            </button>
          </div>

          {preview.error ? (
            <div className="warning-banner" role="status">
              {preview.error}
            </div>
          ) : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Days</th>
                  <th>Rate</th>
                  <th>Interest</th>
                  <th>Principal Paid</th>
                  <th>Closing Principal</th>
                </tr>
              </thead>
              <tbody>
                {preview.schedule.rows.map((row) => (
                  <tr key={row.rowId}>
                    <td>{row.periodEndDate}</td>
                    <td>{formatEventType(row.eventType)}</td>
                    <td>{row.days}</td>
                    <td>{formatRate(row.annualRateBps)}</td>
                    <td>{formatCurrency(row.interestAccruedCents)}</td>
                    <td>{formatCurrency(row.principalPaidCents)}</td>
                    <td>{formatCurrency(row.closingPrincipalCents)}</td>
                  </tr>
                ))}
                {preview.schedule.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No valid schedule rows yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function buildSchedulePreview(events: LoanEvent[]): {
  schedule: AmortizationSchedule;
  error: string | null;
} {
  try {
    return {
      schedule: generateAmortizationSchedule(events),
      error: null
    };
  } catch (error) {
    return {
      schedule: {
        rows: [],
        totals: {
          disbursedCents: 0,
          paymentCents: 0,
          interestAccruedCents: 0,
          interestPaidCents: 0,
          principalPaidCents: 0
        }
      },
      error: error instanceof Error ? error.message : "Unable to generate schedule"
    };
  }
}

function MoneyField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <NumberField
      icon={<IndianRupee size={17} aria-hidden="true" />}
      label={props.label}
      value={props.value}
      onChange={props.onChange}
    />
  );
}

function NumberField(props: {
  icon: ReactNode;
  label: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="input-field">
      <span>{props.label}</span>
      <div className="input-shell">
        {props.icon}
        <input
          inputMode="decimal"
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        />
        {props.suffix ? <em>{props.suffix}</em> : null}
      </div>
    </label>
  );
}

function DateField(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="input-field">
      <span>{props.label}</span>
      <div className="input-shell">
        <CalendarClock size={17} aria-hidden="true" />
        <input type="date" value={props.value} onChange={(event) => props.onChange(event.target.value)} />
      </div>
    </label>
  );
}

function Metric(props: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="metric">
      <div className="metric-icon">{props.icon}</div>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function buildPreviewEvents(form: LoanFormState): LoanEvent[] {
  const principalCents = dollarsToCents(parseAmount(form.principal));
  const emiCents = dollarsToCents(parseAmount(form.emi));
  const prepaymentCents = dollarsToCents(parseAmount(form.prepaymentAmount));
  const annualRateBps = Math.round(parseAmount(form.annualRate) * 100);

  return [
    {
      id: "11111111-1111-4111-8111-111111111111",
      schemaVersion: "1.0",
      type: "DISBURSEMENT",
      effectiveDate: form.startDate,
      appliedAt: `${form.startDate}T00:00:00.000Z`,
      payload: {
        amountCents: principalCents
      }
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      schemaVersion: "1.0",
      type: "RATE_CHANGE",
      effectiveDate: form.startDate,
      appliedAt: `${form.startDate}T00:01:00.000Z`,
      payload: {
        annualRateBps
      }
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      schemaVersion: "1.0",
      type: "EMI",
      effectiveDate: form.firstEmiDate,
      appliedAt: `${form.firstEmiDate}T00:00:00.000Z`,
      payload: {
        amountCents: emiCents
      }
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      schemaVersion: "1.0",
      type: "PREPAYMENT",
      effectiveDate: form.prepaymentDate,
      appliedAt: `${form.prepaymentDate}T00:00:00.000Z`,
      payload: {
        amountCents: prepaymentCents,
        strategy: form.strategy
      }
    }
  ];
}

function parseAmount(value: string): number {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

function formatRate(rateBps: number): string {
  return `${(rateBps / 100).toFixed(2)}%`;
}

function formatEventType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
