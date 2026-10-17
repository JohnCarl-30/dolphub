# Add a homepage particle network and Motion feedback

Date: 2026-10-18. Branch: `feat/web-motion`.

## What changed and why

Added a viewport-sized decorative particle network to the existing student homepage, plus a restrained hero entrance and hover/tap feedback for filters and the new pause control. The network uses the existing ink token against Dolphub's light background. Existing copy, typography, grid breakpoints, and opaque card/statistics surfaces are preserved.

The particle renderer loads through a client-only dynamic import. One shared promise initializes the slim engine. Configuration uses 70 particles at widths of 1024px or more, 45 at 640–1023px, and 30 below 640px, with 150px proximity links, 0.25 link opacity, 0.6 movement speed, and a 60 FPS cap.

Window-level pointer detection keeps foreground controls clickable despite the canvas having no pointer hit area. Repulsion is active only with a fine, hover-capable pointer while running. Pause/resume controls the existing container. Tab visibility and engine restarts preserve the user's pause state.

Server rendering and initial hydration use the same conservative preference snapshot. Particles wait until browser preferences are available. Reduced motion replaces the network with a static CSS pattern and suppresses transform effects. The static fallback also remains available if the dynamic chunk or particle initialization fails.

## Dependency and lifecycle decisions

- Added Motion 14.3.0, tsParticles React 3.0.0, and slim/engine 3.9.1. The engine is a direct dependency because the implementation imports its runtime and types.
- The inspected React 4.4.0 package exports types from `lib/index.d.ts`, although its declarations are shipped at the package root. Version 3 avoids a vendor patch. npm marks the 3.x packages deprecated; moving to a corrected 4.x package remains future dependency maintenance.
- The React 3 wrapper does not catch async container-load rejection or handle a container resolving after effect cleanup. This implementation uses its engine initializer and explicitly owns container loading, failure handling, and destruction instead. Each mount receives a unique host ID; late containers and partially initialized failed containers are destroyed.
- Hover listeners stay registered while the active hover mode changes. This avoids missing repulsion after resume and allows the engine to remove its listeners during destruction.

## Files touched

- `app/home-page.tsx`: homepage integration, Motion entrance, preference handling, pause/resume and status.
- `app/globals.css`: homepage-only static background and reduced-motion safeguards.
- `components/course-filter.tsx`: Motion hover/tap feedback without changing props or filtering semantics.
- `components/animations/use-motion-environment.ts`: hydration-safe media-query and visibility subscription with cleanup.
- `components/particles/particle-background.tsx`: client renderer, shared initialization, engine lifecycle and playback synchronization.
- `components/particles/particle-boundary.tsx`: fallback for dynamic chunk/render errors.
- `lib/particles.ts`, `lib/particle-session.ts`: typed configuration, playback policy and async lifecycle helpers.
- `lib/particles.test.ts`, `lib/particle-session.test.ts`: 20 new test cases.
- `package.json`, `package-lock.json`: dependency additions.
- `docs/web-motion-report.md`: this report.

## Files and behavior not changed

- `app/page.tsx`, `app/layout.tsx`, `app/providers.tsx`: metadata, JSON-LD, fonts, providers and root layout.
- Shared shell, navigation, footer, profile cards and mock-store persistence.
- Profile, dashboard and authentication routes; existing service/action interfaces.
- `lib/services/`, `lib/db/`, `lib/storage/`, `drizzle/` and backend wiring.
- Next.js configuration, Vitest configuration, CI workflow and existing design rules.
- No public API, database schema, new route, or live settings panel was added.

## Verification completed

Checks ran with Node 22.23.3, matching CI's Node 22 major version.

| Check | Result |
| --- | --- |
| `npm test` | Passed: 112 tests across 16 files |
| Targeted particle tests | Passed: 20 tests across 2 files |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; homepage remains statically prerendered |
| `git diff --check` | Passed |

New tests cover responsive boundaries at 639/640px and 1023/1024px, supplied color tokens, window interaction settings, hydration readiness, reduced motion, manual pause, visibility precedence, fine/coarse pointer repulsion, destroyed containers, initialization/load failures, navigation during initialization, and late-container destruction.

Read back changed source files. Inspected generated homepage HTML: one h1 heading, four student profile links, the publishing instructions, one JSON-LD script, canonical `https://dolphub.tech`, and no server-rendered canvas. Confirmed the server route, root layout, shared shell, mock store and protected backend paths have no diff.

The initial dependency download left incomplete native binaries; `npm ci` repaired the local installation. The first sandboxed build could not fetch existing Google Fonts and cached a worker-port error. A build with the required permissions and a fresh generated Turbopack cache succeeded. No application configuration was changed for these environment issues.

## Browser acceptance checks still pending

Browser navigation to `http://127.0.0.1:3000` was denied. After explicit user approval, a retry was still denied by a saved browser permission setting. No alternate browser or network workaround was attempted.

These checks are **unverified**, not passed:

- Visual rendering, proximity links, repulsion and pause/resume at 1440px, 768px and 375px.
- Keyboard focus, clickable navigation/filter/profile controls, empty-filter layout and horizontal overflow.
- Dashboard edits propagating through the existing mock store.
- Initial/live reduced motion, runtime failure fallback and repeated route navigation in a browser.
- Browser console errors, canvas duplication and actual listener cleanup under real navigation.
- The requested 10-second performance samples and targets of at least 50 FPS on desktop and 30 FPS on mobile emulation. No FPS result or device-performance claim is made.

Run the local dev server and complete these checks once browser access is available. Automated tests and the production build do not replace visual or device testing.
