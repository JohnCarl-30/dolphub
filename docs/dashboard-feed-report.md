# Dashboard feed and profile route split

Date: 2026-10-18. Branch: `codex/dashboard-feed-mockup`.

## What changed and why

Resolved the route naming collision that placed the profile editor at `/dashboard`. The protected dashboard now presents a responsive community feed, while the existing editor lives at the protected `/profile` route. Public student pages remain at `/u/<handle>`, and successful sign-in continues to land on `/dashboard`.

The feed is an interactive browser-only mock. It supports temporary post publishing, empty-post validation, reactions, comment panels, and deterministic Recent and Top sorting without adding persistence or changing backend service contracts. Desktop uses identity, feed and discovery columns; phones keep the identity summary above the feed and hide discovery.

## Files touched

- Rebuilt `app/dashboard/page.tsx` and `app/dashboard/dashboard-page.tsx` as the protected feed route and interactive feed UI.
- Moved the editor UI to `app/profile/profile-editor.tsx` and added the protected `app/profile/page.tsx` route.
- Updated the shared header, menu and crawler rules for separate Dashboard and Profile destinations.
- Updated route documentation in `docs/ARCHITECTURE.md` and private-page indexing guidance in `docs/BACKEND.md`.
- Extended Playwright coverage and added an isolated local session seed for authenticated browser tests.
- Added a guarded browser-test configuration mode; production requirements remain unchanged unless the explicit test flag is set.

## Files not touched

Database schema and migrations, profile and project service contracts, server actions, public profile routing and content, sign-in completion behavior, image storage, global design tokens, and dependency versions were not changed. Feed posts, reactions and comments are not persisted.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed; Next.js route types generated successfully.
- `npm test`: 20 files and 180 tests passed.
- `E2E_PORT=3199 npm run test:e2e`: 90 tests passed across desktop and phone projects. This command also completed the production build before starting the isolated test server.
- Browser readback confirmed authenticated route separation, signed-out redirects, active navigation states, profile-editor validation, post validation and publishing, reactions, comments, both sorting modes, the desktop rails, the hidden phone discovery rail, focus visibility and no horizontal overflow.
- An initial browser run reused an unrelated stale server on port 3100 and was discarded. Verification used isolated port 3199 and the current checkout.

## Compatibility

Existing `/dashboard` bookmarks now open the feed and provide an Edit profile link to `/profile`. Existing `/u/<handle>` links remain unchanged. No API, schema or data migration is required.
