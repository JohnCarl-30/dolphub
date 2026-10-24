# Public landing and private home showcase

## What changed and why

`/` is now the public, indexable Dolphub landing page for every visitor. It explains what Dolphub is, its audience and vision, offers page-creation and login actions, and reserves a featured-student section for configured public portfolio handles.

The existing showcase moved unchanged to authenticated `/home`. Signed-out visits continue through `/dashboard?next=/home`, so a successful sign-in returns to the showcase. Logout now goes to the public landing page.

## Files touched

- Root and `/home` routes, landing presentation, featured-student configuration, navigation, and logout routing.
- SEO metadata, sitemap/robots documentation, architecture/design documentation, and browser/unit regression coverage.

## Files and behavior not changed

- Public profile URLs at `/u/<handle>`, dashboard behavior, profile editing, opportunity detail pages, database schema, and service contracts.
- No featured students are selected by default; adding handles to the local configuration controls that section.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e`
