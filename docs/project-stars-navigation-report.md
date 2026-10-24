# Project stars and public navigation

## Report

Added public What, About, and Vision pages, a compact landing page, and a project showcase that ranks up to three public projects by stars, then recency. Each student appears once in the showcase.

## Change and reason

Signed-in students can add or remove one star from another student's visible project. Project owners cannot star their own work. Star totals are public, while the people who starred remain private. The public header now offers What, About, and Vision, while signed-out visitors see Log in / Sign up instead of private navigation. Privacy, Terms, and Support are visible outside the hamburger menu.

## Files touched

- Public routes, landing presentation, navigation, project star control, server action, services, schema, migration, cache tags, sitemap, tests, and product documentation.

## Files not touched

- Existing company or project configuration, authentication implementation, image storage, and unrelated thesis material.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test -- lib/services/project-stars.test.ts`
- Focused Playwright checks for project stars and navigation on desktop and phone.
