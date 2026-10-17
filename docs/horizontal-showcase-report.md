# Add an eased student showcase and scroll-linked particle network

Date: 2026-10-18. Branch: `feat/sidescroll`.

## What changed and why

Replaced the homepage student grid with a sticky horizontal showcase. Each published student has one card with their existing details, first-project title and description, and public-profile link. Course counts, filtering, mock-store updates, community statistics, and the publishing sequence remain connected to the existing data. Homepage copy now refers to the showcase.

The wrapper adds only the measured horizontal overflow to the viewport height. Normal vertical scrolling drives the track through a smoothstep ease-in-out curve, `p²(3−2p)`. Reversing or stopping scroll does not queue transitions or create inertial catch-up. One scheduled animation frame updates the card transform, progress bar, and background position; React state updates only for layout and traversal-state changes.

The particle layer now moves vertically across the homepage and horizontally with showcase progress. Displacement stays within a 15% overscan on every edge. The existing canvas remains viewport-sized with overscan rather than spanning the entire page. Autonomous particle drift pauses during pinned traversal while the layer continues to follow scrolling. The manual pause control freezes both particle drift and background displacement. Existing visibility and reduced-motion rules retain precedence. The installed particle engine already subtracts the canvas's transformed bounding rectangle when calculating pointer coordinates, so no vendor changes were needed.

## Accessibility and layout handling

- Server rendering and initial hydration show a readable vertical list. Reduced motion forces a single-column list and static background through CSS and the existing preference subscription.
- A list/scroll toggle remembers the visitor's choice in session storage, with an in-memory fallback when storage is unavailable.
- Insufficient viewport height uses a list without truncating card content. When all cards fit horizontally, the section uses natural flow without extra scroll height. Empty filters keep the existing empty card.
- Keyboard focus reveals offscreen cards using the inverse easing curve, including reverse navigation. View changes retain the selected card. Filtering retains focus on its control.
- Skip showcase moves scroll position and focus immediately to the labelled statistics section. Ordinary vertical scrolling resumes after the final card.
- ResizeObserver and font/viewport listeners refresh measurements. The wrapper retains its current height while measuring, avoiding temporary document shrinkage that can clamp scroll position near the bottom. Cleanup removes observers, listeners, and pending frames.
- Existing image placeholders remain. No image pipeline or new image requests were added.

## Files touched

- `app/home-page.tsx`: integration, shared background refs, traversal-aware particle playback, copy, and skip destination.
- `app/globals.css`: sticky frame, track/list layouts, background overscan, and immediate reduced-motion safeguards.
- `components/student-showcase.tsx`: filters, cards, view preference, progress, and skip controls.
- `components/animations/use-showcase-scroll.ts`: shared scroll pipeline, measurement, keyboard reveal, view anchoring, and cleanup.
- `components/profile-card.tsx`: optional first-project preview and compact showcase image slot.
- `lib/showcase.ts`, `lib/showcase.test.ts`: geometry, reversible easing, inverse focus mapping, fallback policy, and bounded background offsets.
- `lib/particles.ts`, `lib/particles.test.ts`: optional showcase traversal argument and playback precedence test.
- `docs/horizontal-showcase-report.md`: this report.

## Files and behavior not changed

No dependency, public API, database schema, backend, authentication, metadata, or routing changes. No changes to `lib/services/`, `lib/db/`, `lib/storage/`, `drizzle/`, server actions, shared navigation/footer, mock-store persistence, or project configuration. No GSAP or global scroll interception was added.

## Verification completed

Checks used the existing local Node 22 runtime.

| Check | Result |
| --- | --- |
| Full Vitest suite | Passed: 153 tests across 19 files |
| Final targeted showcase/particle tests | Passed: 22 tests across 2 files |
| ESLint | Passed |
| Next.js type generation and TypeScript | Passed |
| Production build | Passed; homepage remains statically prerendered |
| Git diff whitespace check | Passed |

Eleven new tests cover overflow sizing, traversal boundaries, easing bounds and monotonicity, inverse mapping, keyboard targets, list/short-screen/zero-overflow policy, background overscan, and traversal/manual/visibility playback precedence.

Production preview verified in the in-app browser at 554 × 724 CSS pixels:

- Four cards render with project previews; page width remains 554px without horizontal document overflow.
- The sticky frame remains at the viewport top while cards and the network translate together. At scrollY 724, the track translated approximately −276.8px and the network approximately −19.5px horizontally, with progress at 29%.
- Tab reveals the last card fully; Shift+Tab reveals the preceding card. List/scroll switching retains the selected card and removes track transforms in list mode.
- The CS filter displays one card in natural flow; returning to All restores the measured track and keeps filter focus.
- Skip focuses `after-showcase` with the statistics section at viewport top. Subsequent scrolling continues into the publishing content without jumping back.
- Manual particle pause holds the background transform steady while the card track continues moving; resume restores scroll-linked movement.
- No browser warning or error logs were recorded during these checks.

Read back source changes and the rendered production behavior. An initial incremental build reused stale generated CSS; rebuilding with a fresh generated `.next` directory produced and verified the new styles. No configuration changes were made for that cache issue.

## Remaining device and performance checks

Physical budget Android testing, desktop browser coverage, mobile Safari, actual short-screen/zoom and reduced-motion browser checks, dashboard-edit propagation, empty-data browser rendering, and browser back/forward restoration remain unverified. Policy tests cover fallback and reduced-motion selection but do not replace those device checks.

The Lighthouse dependency was available, but downloading its required Chromium browser timed out and then failed to connect. No Lighthouse comparison, CLS result, or measured FPS claim is made. The targets remain a median Lighthouse performance-score regression no greater than five points, CLS no greater than 0.1, and ten-second samples of at least 50 FPS on desktop and 30 FPS on a physical budget Android phone.

No automatic phone-width fallback was enabled without device evidence. If physical phone testing remains below target after optimization, default widths below 640px to the list while retaining the visitor's scroll-view option.
