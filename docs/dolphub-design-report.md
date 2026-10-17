# dolphub-design report

Date: 2026-10-17. Branch: `chore/dolphub-design`.

## What changed

Added [docs/dolphub-design.md](./dolphub-design.md) so Evert and JC share one frontend rule file. It names the live tokens, layout, copy limits, and the backend paths that stay untouched.

## Why

The mock already uses one palette and ITSUA-derived structure. Login and verify still use zinc/dark classes. A short named doc keeps later screens on the same rules without cloning ITSUA copy or images.

## Files touched

- `docs/dolphub-design.md`
- this file

## Files not touched

- `app/globals.css`, layout, mock pages
- `/login`, `/auth/verify` (restyle later against the new doc)
- `lib/services/`, `lib/db/`, `lib/storage/`, `drizzle/`
- `.cursor/skills/` (not created)

## Readback

Hex values in `docs/dolphub-design.md` match `:root` in `app/globals.css`: `#ffffff`, `#0e1012`, `#60636a`, `#f5f5f3`. There is no colour accent. Fonts are Space Grotesk and Geist Mono.

## Test cases

No code behavior changed. No new Vitest cases. Check is a file read against `globals.css`.
