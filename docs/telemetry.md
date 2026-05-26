# Telemetry Spec (Client-side) — OpenLoan

Purpose

- Collect minimal, privacy-preserving telemetry to help improve stability and identify engine exceptions during beta.
- Telemetry is opt-in during onboarding and can be toggled in Settings at any time.

Data collection rules

- No PII (names, emails, addresses) is collected.
- No loan event payloads or entire schedules are uploaded by default.
- Only aggregate or minimal diagnostic data is collected unless the user explicitly agrees to share a reproduction payload.

Events to collect

1. error.engine
   - When the core engine throws an exception during simulation.
   - Payload: { engineVersion, errorName, errorMessage, stackTrace (trimmed), timestamp }
2. error.ui
   - Uncaught UI errors (React error boundaries).
   - Payload: { component, errorName, message, timestamp }
3. perf.schedule_generation
   - Timing for amortization generation (ms) including input size (number of events).
   - Payload: { durationMs, eventCount, timestamp }
4. session.start / session.end
   - Start/end timestamps and session duration in seconds.
   - Payload: { timestamp, sessionId (uuid v4) }
5. opt_in_changed
   - User toggles telemetry consent.
   - Payload: { enabled: boolean, timestamp }

Privacy & retention

- Telemetry IDs: use a randomly generated, local-only UUID (resettable by the user).
- Retention: keep telemetry server-side for 30 days by default, then aggregate and delete raw logs after 90 days.
- Allow users to request data deletion (link to contact email or in-app flow).

Consent language (short)

"Help improve OpenLoan by sharing anonymous crash reports and performance data. No personal or loan data is shared by default. You can opt out at any time."

Consent language (full)

"OpenLoan can optionally collect anonymous error reports and basic performance metrics to help us diagnose crashes and performance issues. This data excludes personal information and does not include full loan payloads unless you explicitly choose to share a reproduction. You can enable or disable telemetry at any time in Settings."

Implementation notes

- Provide a simple TelemetryService interface that respects the opt-in flag and batches events (e.g., 10 events or 30s) before sending.
- Send telemetry over HTTPS to a configured endpoint. Use retries with exponential backoff and drop events after 3 failed attempts.
- Allow an explicit "Send reproduction payload" action on a failed simulation that includes the event list and engine version; require an additional explicit confirmation modal before uploading.

Server-side considerations (if you host)

- Rate-limit incoming events by IP and client ID.
- Store raw events encrypted at rest.
- Provide an administration interface for viewing aggregated errors and performance trends.

Contact

If you have questions about telemetry or data deletion, email: privacy@example.com
