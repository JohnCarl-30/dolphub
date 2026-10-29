# Report

Add a browser photo preview and crop editor before profile or project photos upload.

## Change and reason

- Added one shared modal editor with rotation, drag, pinch, zoom, reset, and confirm or cancel controls. Profile crops are square; project crops match the 16:9 public gallery.
- Changed both photo pickers to hold the selected file until confirmation. Cancelling leaves the saved photo and project photo count unchanged; a failed upload retries the confirmed JPEG.
- Added client canvas rendering for every edited JPEG, PNG, or WebP, including small files. EXIF orientation is decoded once, the crop is drawn into the JPEG, and the existing compression cap remains in effect.
- Updated editor hints and design guidance to describe the new confirmation step.

## Files touched

- `components/photo-editor.tsx`, both photo picker components, `lib/photo-upload.ts`, `package.json`, and `package-lock.json` for the editor and upload preparation.
- `lib/photo-upload.test.ts`, profile browser tests, and `e2e/seed-auth.ts` for geometry, cancel, rotation, EXIF, large files, retry, and phone gesture coverage.
- `DESIGN.MD` and project editor copy for the new interaction.

## Files not touched

- Upload routes, server image re-encoding, server actions, database schema, migrations, services, and storage are unchanged.
- The public project gallery and its 16:9 frame are unchanged.

## Verification

- `npm run lint` and `npm run typecheck` passed.
- `npm test -- lib/photo-upload.test.ts lib/upload-route.test.ts` passed (12 tests).
- The full `npm test` produced no results and was stopped after about 50 seconds; it has a separate recurring PGlite/Vitest stall.
- All 12 focused profile and project Playwright tests passed on desktop and phone, including Chromium phone touch emulation and focus return.
- The full Playwright run had 234 passing, 2 skipped, and 2 failures in the unrelated landing canonical-link assertion (it found two canonical links instead of one).
- Physical iOS Safari and Android Chrome devices were not available for manual checks.
