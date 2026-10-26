# Report

Implemented a restrained motion upgrade for Dolphub's public discovery pages. The change adds slower blur-focus introductions, progressive viewport reveals, and native-scroll depth for the persistent particle background while preserving short operational feedback and reduced-motion behavior.

## Change and reason

- Added an `intro-reveal` utility with a 1.1-second rise, blur-to-sharp focus, and 125-millisecond stagger so discovery-page openings feel measured without delaying controls or feedback.
- Added progressively enhanced `viewport-reveal` animations with capped range offsets. Unsupported browsers keep all content visible and static.
- Applied the discovery motion only to the landing page, signed-in showcase, explanatory pages, opportunities, and public profiles. Authentication, dashboard, editor, admin, legal, and support pages remain direct.
- Split particle movement into provider-owned vertical depth/scale and showcase-owned horizontal offset. This prevents the two scroll systems from overwriting one another and retains immediate focus and skip-navigation corrections.
- Preserved the existing single canvas, particle cap, pointer behavior, reduced-motion fallback, and route persistence. No motion or rendering dependency was added.
- Updated automated coverage for animation values, progressive fallback, reduced motion, card reveal ranges, particle depth, route resets, and canvas persistence.

## Files touched

- `app/globals.css` and `DESIGN.MD` for the motion utilities, accessibility rules, particle transform composition, and design contract.
- Public discovery page and component files under `app/` and `components/` to apply intro and viewport reveals.
- `components/animations/reveal.ts`, `components/animations/use-showcase-scroll.ts`, `components/particles/particle-network-provider.tsx`, and `lib/showcase.ts` for capped reveal ranges and composed particle movement.
- `e2e/motion.spec.ts`, `e2e/pages.spec.ts`, and `lib/showcase.test.ts` for regression coverage.

## Files not touched

- No database schema, migrations, service logic, storage logic, authentication behavior, API contracts, or dependencies changed.
- No loaders, cycling headlines, character splitting, marquees, additional pinned sections, page curtains, or page transitions were added.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- The affected unit tests passed.
- Full Playwright passed: 186 tests passed and 2 intentional tests were skipped across desktop and phone projects.
- Desktop visual inspection passed; Playwright also verified phone layout and horizontal-overflow behavior.
- A direct standalone `npm run build` remained blocked by the local Turbopack worker-port restriction. The production build used by the full Playwright harness completed successfully.
- The full unit command entered the repository's existing PGlite/Vitest hang and was stopped after producing no test results; the changed unit suite passed independently.

## Follow-up: opaque text card surfaces

Added white backgrounds to student showcase cards, opportunity cards, publishing steps, the empty showcase state, and the saved newsletter state so the decorative motion nodes do not compete with readable card content. Particle components, motion hooks, animation utilities, and motion tokens were not changed.

## Follow-up: informational page and footer surfaces

Added an opaque white card surface to the shared informational-page content and an opaque white background to the shared footer. This applies across all pages using those shared components; the motion network remains unchanged.
