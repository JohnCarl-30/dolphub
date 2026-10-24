# Profile picture and hamburger logout

## Change and reason

Students can now upload one optional public profile picture without using a project-photo slot. The picture appears in their public profile, dashboard identity rail, and signed-in hamburger menu. The menu also exposes the existing session-revoking logout action so students can end their session from any page.

## Files touched

- Profile-picture schema, migration, storage service, upload route, cleanup, and account-deletion handling.
- Profile editor, public profile, dashboard, and shared hamburger-menu UI.
- Architecture, backend-contract, design, unit, route, and browser-test coverage.

## Files not touched

- Showcase-card image selection, link-preview metadata, and the ten-project-photo limit.
- Sign-in providers and session-token format.
