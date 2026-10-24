# Responsive top navbar

Date: 2026-10-25. Branch: `feat/responsive-top-navbar`.

## What changed and why

The shared top navbar now keeps What, About, Vision, Privacy & Security, Terms, and Support in one centered, non-wrapping row from 1024px upward. The former legal utility row and desktop burger are removed. Signed-in desktop users keep Home, Dashboard, Profile, and Log out inline on the right; signed-out users keep the Log in and Sign up pills.

Below 1024px, the burger owns the public destinations. It includes signed-in destinations and Log out when applicable. Signed-out authentication actions are included only when the header pills are hidden. The panel closes after navigation, outside interaction, Escape, and a resize to the desktop breakpoint.

## Files touched

- `components/site-header.tsx`, `components/site-menu.tsx`, and `components/site-navigation.ts`
- `e2e/pages.spec.ts` and `e2e/profile-editor.spec.ts`
- `DESIGN.MD`
- This report

## Files not touched

Routes, page content, authentication behavior, APIs, service logic, database schema, migrations, global design tokens, package manifests, and lockfiles.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed; Next.js route types generated successfully.
- `npm test`: could not complete on this host. Vitest hung before test discovery with both fork and thread pools under Node 25; the local runner processes were stopped after each attempt.
- `npx playwright test e2e/pages.spec.ts e2e/profile-editor.spec.ts`: passed, 90 tests across desktop and phone projects. It covers the 1440px, 1024px, 768px, and 375px navbar contract, keyboard and Escape handling, link closure, resize closure, active links, account actions, and profile flows.
- `npm run test:e2e`: completed with two unrelated parallel-test failures: a duplicate canonical-link assertion in the public-landing test and a profile-save timeout in the long profile-editor flow. The focused affected browser suite passed after the implementation.

## Compatibility

This is a presentation and navigation-layout change. Public URLs, active-link semantics, and the existing sign-in and sign-out endpoints remain unchanged.
