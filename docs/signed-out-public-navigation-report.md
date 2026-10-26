# Signed-out public navigation

Date: 2026-10-26. Branch: `feat/refine-public-motion`.

## What changed and why

Restored the six informational destinations to the centered desktop header for signed-out visitors. Signed-in visitors continue to see Home, Dashboard, and Profile centered, with the informational destinations folded into the right-side hamburger. Signed-out mobile layouts continue to use the hamburger because the inline row is hidden below `lg`.

## Files touched

- `components/site-header.tsx`
- `components/site-menu.tsx`
- `e2e/pages.spec.ts`
- `DESIGN.MD`
- This report

## Files not touched

Routes, page content, authentication behavior, server actions, APIs, database schema and migrations, service logic, storage and upload handling, global design tokens, package manifests, and lockfiles.

## Test cases and readback

- Desktop signed-out pages show all six public links inline and hide the hamburger.
- Signed-in desktop pages keep account links centered and show public links in the hamburger.
- Narrow signed-out pages keep public links in the hamburger with the existing authentication actions.
- Lint and typecheck pass.
- `npx playwright test e2e/pages.spec.ts -g 'site menu'`: passed, 12 tests across desktop and phone projects, covering signed-out inline links, signed-in hamburger links, responsive transitions, dismissal behavior, and account navigation.
