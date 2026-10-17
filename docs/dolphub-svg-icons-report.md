# Dolphub SVG logo and icons

Date: 2026-10-18. Branch: `codex/dolphub-svg-icons`.

## What changed and why

Replaced the placeholder D icons and header dot with a faithful vector of the supplied DH/dolphin artwork. The reusable SVG preserves the dolphin, letters, and separating outline as paths with transparent gaps, without embedded images or font dependencies.

The browser favicon centers that geometry in a padded square and switches from black to white with the browser's preferred color scheme. The Apple icon uses identical geometry rendered as an opaque 180×180 PNG on white. The header uses a 48×26 image beside the existing Dolphub home link, with empty alt text and the existing keyboard focus treatment. Manifest entries now match the static icon URLs, MIME types, and dimensions.

## Files touched

- Added `public/dolphub-logo.svg`, `app/icon.svg`, and `app/apple-icon.png`.
- Removed the superseded `app/icon.tsx` and `app/apple-icon.tsx` generators.
- Updated `app/manifest.ts` and `components/site-header.tsx`.
- Added `scripts/generate-icons.mjs`; run `node scripts/generate-icons.mjs` after editing the master SVG to regenerate both icons.
- Added `e2e/branding.spec.ts` and this report.

## Files not touched

Application APIs, services, database, authentication, page content, global theme, typography, Open Graph images, package manifests, lockfile, existing tests, and existing design documentation.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; static `/icon.svg`, `/apple-icon.png`, and `/manifest.webmanifest` routes generated successfully.
- `npm test -- lib/seo.test.ts`: 12 tests passed.
- `npx playwright test e2e/branding.spec.ts`: 6 tests passed across desktop and phone projects. Checks cover served metadata, manifest URLs and MIME types, successful asset responses, Apple dimensions and opaque white background, favicon light/dark colors, absence of embedded raster images and background rectangles, logo loading, accessible home-link name, keyboard focus, narrow-screen overflow, and home navigation.
- Inspected rendered previews at 16, 32, 48, and 180 pixels, plus desktop and 320-pixel header screenshots and light/dark favicon screenshots. The full mark remains proportional and unclipped. Fine gaps become coarse at 16 pixels; the geometry was intentionally preserved rather than simplified.
- Compared thresholded source and vector silhouettes at the source resolution: 99.776% intersection over union.
- Read back the SVG files, served metadata, manifest, and PNG metadata. Confirmed the Apple image is 180×180 RGB without alpha. Regenerating both icon assets produces byte-identical output.
- Restored missing local dependencies and installed Playwright Chromium to run validation; package manifests and lockfile were unchanged. One initial browser assertion read the lazily loaded logo too early; it now waits for successful decoding. The final run passes.

## Compatibility

Icon URLs change from `/icon` and `/apple-icon` to `/icon.svg` and `/apple-icon.png`. Next.js metadata and the manifest reference the new assets. The favicon defaults to black when preferred-color-scheme media queries are unsupported. The site itself retains its existing light theme.
