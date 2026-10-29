# Profile view analytics

Add anonymous, aggregated activity reporting to student dashboards while keeping public profile pages cached and tracking failures non-blocking.

## Change and reason

- Added daily profile-view, source, project-click, and profile-link-click aggregates plus a short-lived HMAC visitor dedupe table.
- Added view and outbound-click beacons; profile views ignore hidden profiles, owners, and common bots. Referrer categories are recorded without storing raw IP addresses or user agents.
- Added owner-only dashboard cards for 30-day views, estimated visitors, source totals, project clicks, and a small views milestone.
- Updated the privacy notice and nightly cleanup for expiring dedupe records.

## Files touched

- `lib/db/schema.ts`, `drizzle/0009_thankful_marten_broadcloak.sql`, migration metadata.
- Tracking service and routes, public profile beacon and outbound link instrumentation.
- Dashboard analytics, privacy notice, and focused source-classification tests.

## Files not touched

- No search-impression counter was added because Dolphub has no on-site profile search yet.
- No raw visit history, IP address, or user-agent field is stored.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test -- lib/services/analytics.test.ts` passed (2 tests).
- `npm run build` and `npm run test:e2e` could not start because the sandbox blocked Turbopack worker port creation and Playwright's local IPC pipe, respectively.
