# Full horizontal root-page journey

## What changed and why

Replaced the root page's separate hero and information rail with one horizontal journey through the hero, What, About, Vision, and Featured projects. Privacy & Security, Terms, and Support remain navigation and footer destinations. The root landing content remains the same for signed-out and signed-in visitors; account-aware header navigation is unchanged.

On fine-pointer desktop screens, the complete journey uses a measured, pinned horizontal rail with cached scroll geometry, header clearance, a small end hold, and an accessible progress bar. Smaller screens, coarse pointers, and reduced motion use a native horizontal scroll-snap list. Without JavaScript, the server-rendered panels remain a normal vertical page. Keyboard focus reveals the focused panel during pinned traversal.

The existing signed-in `/home` showcase driver and the streamed featured-project fallback were left unchanged.

## Files touched

- `components/landing-information-rail.tsx` (removed)
- `components/landing-page-journey.tsx` (added)
- `app/landing-page.tsx`
- `app/globals.css`
- `DESIGN.MD`
- `e2e/landing.spec.ts`
- `docs/horizontal-information-rail-report.md`

## Files not touched

No service, database, storage, migration, authentication, `/home` showcase, or informational-page content was changed.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- Production `npm run build` passed.
- The focused landing Playwright suite passed: 10 tests across desktop and phone projects.
- The Vitest run remained hanging under the repository's Node 25 environment and was stopped.
