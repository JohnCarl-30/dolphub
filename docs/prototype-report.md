# Dolphub frontend mock

Date: 2026-10-17. Built on `claude/friendly-davinci-1kzldr` at `ab29b75`.

## What changed

The create-next-app homepage is now a Dolphub mock: a student grid, a public profile, and a phone-first dashboard. Sample students live in `lib/mock-profiles.ts`. Dashboard edits stay in `sessionStorage` for the tab, so the grid and `/u/<handle>` update together. The backend services, schema, storage, and existing Vitest files were not edited.

## Why

`docs/PLAN.md` still has no frontend owner. This mock is the visual and route shell for `/`, `/u/[handle]`, and `/dashboard`, using the public ITSUA layout as a method, not as a copy of their agency site.

## Files touched

- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/providers.tsx`, `app/home-page.tsx`
- `app/u/[handle]/page.tsx`, `app/u/[handle]/profile-page.tsx`
- `app/dashboard/page.tsx`, `app/dashboard/dashboard-page.tsx`
- `components/site-header.tsx`, `components/site-footer.tsx`, `components/site-shell.tsx`
- `components/profile-card.tsx`, `components/course-filter.tsx`, `components/project-list.tsx`
- `components/mock-store.tsx`
- `lib/mock-profiles.ts`, `lib/mock-profiles.test.ts`
- `docs/reverse-engineering/dolphub-visual-notes.md`
- this file

## Files not touched

- `lib/services/`, `lib/db/`, `lib/storage/`, `lib/server.ts`, `drizzle/`
- `docs/BACKEND.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md`
- Existing `*.test.ts` files under `lib/services/`

## Test cases

- Grid hides a student with no project (`lea`).
- Course filter returns only that course, or an empty list (shows “be the first”).
- Profile lookup is case-insensitive and returns null for an unknown handle.
- Updating the editable student changes both the public profile and the grid.
- Browser: filter, open a profile, follow demo/source/Messenger, edit Mira on `/dashboard`, confirm the home card updates, repeat at 390px width.

## Out of this mock

Sign-in, server actions, R2 uploads, admin, ISR, and MCP servers.
