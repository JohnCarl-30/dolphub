# Production navigation and footer

Date: 2026-10-18. Branch: `fix/remove-community-statistics-`.

## What changed and why

Updated the shared navigation labels so their names match their destinations: `[ 00 ] Home` opens `/`, and `[ 01 ] Profile` opens the current-user editor at `/dashboard`. The destinations and active-link behavior are unchanged.

Replaced the mock-only footer disclaimer with production copy: `Dolphub · Built for PCU tech students` and `© 2026 Dolphub contributors · MIT License`. Merged the current `main` branch first so the feature branch includes the existing Dolphub SVG logo implementation and its assets instead of serving a broken image.

## Files touched

- Updated `components/site-header.tsx` and `components/site-footer.tsx`.
- Extended `e2e/pages.spec.ts` with navigation destination, active-state, footer-copy, and prototype-copy removal checks.
- Updated `DESIGN.MD` with the production shared-chrome contract.
- Added this report.
- The merge from `main` brought in the already-reviewed SVG logo and icon files, their generator, browser coverage, and prior implementation report.

## Files not touched

Public routes, authentication, APIs, service logic, database schema and migrations, dashboard form behavior, public student-profile behavior, global theme tokens, typography, package manifests, and lockfiles were not changed by this fix.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed; Next.js route types generated successfully.
- `npm test`: 20 files and 179 tests passed.
- `npm run build`: passed with Next.js 16.4.2; all application routes built successfully.
- `E2E_PORT=3101 npx playwright test e2e/pages.spec.ts e2e/branding.spec.ts`: 38 tests passed across desktop and phone projects.
- The first browser invocation reused the already-running stale server on port 3100 and was discarded. The isolated production-server run above used the current checkout and passed completely.
- Read back `/` and `/dashboard` from a temporary production server on port 3102. Confirmed both logos decoded, both footer lines rendered, each link kept its intended destination, Home alone had `aria-current="page"` on `/`, and Profile alone had it on `/dashboard`.

## Compatibility

The change is presentation-only. Existing bookmarks and integrations keep using `/` and `/dashboard`; no API, schema, or data migration is required.
