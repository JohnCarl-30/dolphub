# Profile hamburger navigation

Date: 2026-10-23. Branch: `feat/particle-network-layer`.

## What changed and why

Moved `[ 02 ] Profile` from the always-visible desktop header into the hamburger menu. This keeps the desktop header focused on Home and Dashboard while preserving direct access to the profile editor at every viewport size.

The menu keeps the existing numbering and routes. On desktop, Profile is the first menu item. On phones, Home and Dashboard remain first, followed by Profile, Privacy & Security, Terms, and Support.

## Files touched

- Updated `components/site-header.tsx` and `components/site-menu.tsx`.
- Updated the shared navigation contract in `DESIGN.MD`.
- Updated `e2e/pages.spec.ts` with desktop and phone menu placement, ordering, active-state, and interaction coverage.
- Added this report.

## Files not touched

Public routes, authentication, APIs, service logic, database schema and migrations, dashboard and profile-editor behavior, global theme tokens, package manifests, and lockfiles were not changed.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed; Next.js route types generated successfully.
- `npm test`: 28 files and 230 tests passed.
- Targeted Playwright navigation coverage: 8 tests passed across desktop and phone projects on a fresh Turbopack development server. The checks cover desktop and phone ordering, active states on `/dashboard` and `/profile`, selection, outside interaction, Escape closing, and focus return.
- `npm run build`: environment-blocked. After font access was allowed, Turbopack could not bind the local helper-process port used while processing `app/globals.css`. A webpack fallback compiled application code but left Tailwind utilities unprocessed, so it was not accepted as a production readback.
- `npm run test:e2e`: attempted after installing the repository's pinned Chromium build, but a valid production build was unavailable. The navigation-specific tests above passed against Turbopack; full production Playwright verification remains pending.

## Compatibility

This is a presentation-only navigation change. Existing URLs and bookmarks remain valid, and no API, schema, or data migration is required.
