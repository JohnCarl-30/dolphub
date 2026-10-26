# Desktop hamburger navigation

Date: 2026-10-26. Branch: `feat/refine-public-motion`.

## What changed and why

Moved the six informational destinations (What, About, Vision, Privacy & Security, Terms, and Support) into the right-side hamburger at every viewport size. Signed-in desktop users now see Home, Dashboard, and Profile centered in the header. Log out remains in the opened menu, while narrow layouts keep all signed-in destinations in that menu. Signed-out Log in and Sign up controls remain beside the hamburger where visible.

Preserved menu dismissal, focus restoration, active-link semantics, and account identity details. Updated the design source of truth and browser coverage for the new desktop behavior.

## Files touched

- `components/site-header.tsx`
- `components/site-menu.tsx`
- `e2e/pages.spec.ts`
- `DESIGN.MD`
- This report

## Files not touched

Routes, page content, authentication behavior, server actions, APIs, database schema and migrations, service logic, storage and upload handling, global design tokens, package manifests, and lockfiles.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npx playwright test e2e/pages.spec.ts`: passed, 86 tests across desktop and phone projects. Coverage includes desktop menu contents, centered signed-in account navigation, narrow layouts, menu dismissal and focus behavior, logout, active links, and overflow checks.
- After the final signed-out grid adjustment, the focused responsive checks passed: 18 tests covering the burger breakpoint and no-overflow assertions across desktop and phone projects.
- `npm test`: could not complete on this host. Vitest produced no discovery output under Node 25 and was stopped after waiting.
- Read back the modified components, design guide, and browser test file after editing; all contain the new hamburger and centered-account contracts.
