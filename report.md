# Report

Add admin-only menu access and conceal unauthorized admin routes.

## Change and reason

- Added an Admin menu link using the verified server session flag, with graceful header fallbacks when session or dashboard details fail.
- Admin routes now return 404 for signed-out and non-admin visitors. Signed-in denials are recorded in the existing admin audit log, with logging failures kept from breaking the 404 response.
- Removed `/admin` from the robots disallow list.
- Updated the admin E2E access test to expect HTTP 404 for signed-out and ordinary users.
- Added a request proxy for admin pages so denial happens before React streams a 200 response.

## Files touched

- `components/authenticated-site-menu.tsx`, `components/site-header.tsx`, `components/site-menu.tsx`
- `lib/admin.ts`, `app/robots.ts`, `proxy.ts`, `e2e/admin.spec.ts`
- `report.md`

## Files not touched

- Database schema and migrations; the existing audit log table is reused.
- Vercel Firewall settings; no connected Vercel configuration tool is available in this workspace.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- Full admin Playwright spec passed on desktop and phone (17 passed, 1 skipped) using the production build.
