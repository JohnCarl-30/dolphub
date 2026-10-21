# Site-wide interactive particle network

## What changed

The particle network is now owned by a client provider mounted once inside `SiteShell`, so the fixed `z-0` layer is shared by every route and survives client-side navigation. Header, main content, and footer are explicitly `relative z-10`.

The canvas and layer remain `pointer-events: none` and `aria-hidden`. This protects UI click targets; `detectsOn: "window"` is deliberately retained because tsParticles reads hover movement from `window`, not canvas hit-testing. Showcase traversal disables only autonomous drift, leaving the render loop and repulsion available.

Particle density now uses one calibrated area value with a hard 110-particle cap. The 45, 68, and 105 values are representative test checkpoints, not breakpoint configurations. `pauseOnBlur: true` is enabled alongside the existing visibility synchronization.

## Verification

- Source tests cover the single area calculation, representative viewport checkpoints, cap, link settings, window detection, pause-on-blur, and traversal/repulsion playback.
- Browser coverage exercises click-through, actual container particle positions, route persistence, and hidden-tab pause/resume without raw canvas pixel comparisons.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed (28 files, 230 tests).
- Targeted particle tests: passed (2 files, 19 tests).
- `npm run test:e2e` could not launch because this machine does not have the Playwright Chromium executable installed; the runner reached 152 browser-launch failures before test code ran.
- `npm run build` was attempted, but the local Turbopack worker was denied permission to bind its internal port.
