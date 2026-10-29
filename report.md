# Report

Split the signed-in profile editor into separate details and projects pages so students can manage their personal information independently from project content and photos.

## Change and reason

- Kept profile details, profile picture, and the admin takedown notice on `/profile`; added `/profile/projects` for projects and project photos.
- Added editor tabs, route-specific active state, and warnings for unsaved edits when switching tabs or leaving the browser page.
- Kept project, profile, and image changes on the existing server actions and ownership checks. The image limit and upload validation are unchanged.
- Updated dashboard project navigation, architecture routes, and unit and browser coverage.
- Matched particle startup events by the target container ID, avoiding version-specific access to the canvas manager.

## Files touched

- `app/profile/` and `components/nav-link.tsx` for the split editors, route, tabs, and active navigation.
- `components/particles/particle-background.tsx` for matching startup events to the current particle container.
- `app/dashboard/dashboard-page.tsx` and `docs/ARCHITECTURE.md` for project navigation and route documentation.
- `lib/profile-form.ts`, `lib/profile-form.test.ts`, and profile editor browser tests for isolated form changes and regression coverage.
- `e2e/seed-auth.ts` for independent browser-test accounts.

## Files not touched

- No server actions, database schema, migrations, service logic, storage logic, or upload endpoints changed.
- No project pagination was added; the editor retains the current full-list save behavior.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test -- lib/profile-form.test.ts` passed (5 tests).
- `npm test -- lib/services/projects.test.ts lib/upload-route.test.ts` passed (11 tests), including cross-user project rejection and upload limits.
- `npm run test:e2e` passed (226 passed, 2 skipped).
- The final profile, page, and navigation browser specs passed (98 tests) after the last route assertions were added.
- The full `npm test` run produced no test results for about 30 seconds and was stopped; the focused profile, project ownership, and upload unit tests passed (16 tests).
- After installing the locked dependencies (`@tsparticles/engine` and `@tsparticles/slim` 4.5.0), `npm run typecheck` and `npm run lint` passed, and the production Playwright suite passed (226 passed, 2 skipped).
