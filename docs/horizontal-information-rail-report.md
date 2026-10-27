# Horizontal information rail on `/`

## What changed and why

Replaced the root page's three informational cards with six concise cards linking to What, About, Vision, Privacy & Security, Terms, and Support. The root landing content remains the same for signed-out and signed-in visitors; account-aware header navigation is unchanged.

On fine-pointer desktop screens, the cards use a measured, pinned horizontal rail with cached scroll geometry, a small end hold, and an accessible progress bar. Smaller screens, coarse pointers, reduced motion, and browsers before enhancement use a native horizontal scroll-snap list. Keyboard focus reveals the focused card during pinned traversal, and a skip link moves directly to featured projects.

The existing signed-in `/home` showcase driver and the streamed featured-project fallback were left unchanged.

## Files touched

- `components/landing-information-rail.tsx`
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
- The focused Playwright run was blocked before tests by the local `tsx` worker-pipe `EPERM` restriction.
- The Vitest run remained hanging under the repository's Node 25 environment and was stopped.
