# Remove the homepage particle pause control

Date: 2026-10-18. Branch: `feat/sidescroll`.

## What changed and why

Removed the “Pause particles” button beneath the homepage introduction and its reserved vertical space, as requested in the browser review. The former manual pause state and related prop plumbing are gone. The particle network still follows scrolling, pauses its autonomous drift during the horizontal student showcase, and respects visibility and reduced-motion preferences.

## Files touched

- `app/home-page.tsx`: removed the control, its status text, spacing, and manual pause state; kept failure fallback and automatic playback policy.
- `components/student-showcase.tsx` and `components/animations/use-showcase-scroll.ts`: removed manual pause props so the background follows scrolling when motion is allowed.
- `lib/particles.ts` and `lib/particles.test.ts`: simplified playback policy and updated cases for automatic traversal pause and preference precedence.
- `docs/remove-particle-pause-report.md`: this report.

## Files and behavior not changed

The showcase cards, filters, progress bar, list toggle, skip link, project previews, image placeholders, layout geometry, backend, database, shared navigation, and particle configuration remain as before. Existing historical reports remain unchanged.

## Verification

- Full Vitest suite: 153 tests passed across 19 files.
- ESLint, Next.js type generation, TypeScript, production build, and `git diff --check`: passed.
- Production browser readback at 478 × 724 CSS pixels: no pause/resume button in the DOM or accessibility tree; the hero and showcase meet at the same vertical coordinate after entrance animation settles.
- The particle canvas still renders. After one page of scrolling, the showcase reached 31% progress, its track moved about −316.8px, and the background moved about −17.9px horizontally. Document width remained at the viewport width.
