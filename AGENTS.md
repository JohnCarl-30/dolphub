<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dolphub

Public portfolio pages for PCU tech students at `/u/<handle>`. Read `docs/ARCHITECTURE.md` before changing what the product does, and `docs/BACKEND.md` before touching `lib/services/`, `lib/db/` or `drizzle/`.

## Mock data and real sign-in

`/` and `/u/[handle]` read the database through the cached loaders in `lib/profiles.ts`. `/profile` creates and edits the signed-in student's page through the actions in `app/dashboard/actions.ts`. Photos upload through `/api/upload`; without R2 settings they live in server memory, served from `/dev-images/`, until the server restarts. The `/dashboard` feed's posts, reactions and comments are still sample data that lasts until the page reloads. Browser tests get sample students from `e2e/seed-auth.ts`; `authenticate(page, "newcomer-<project>")` signs in as an account with no page yet, reset before every run. The home page's focus band and upcoming posts read open opportunities through `getOpenOpportunities` in `lib/opportunities.ts`; `e2e/seed-auth.ts` seeds a competition closing tomorrow, so both show in browser tests. The newsletter signup is still a mock that only remembers the choice in the tab. When a page needs a validation rule, import it from `lib/services/validation.ts` so the mock and the server agree.

Sign-in is real. Signed out, `/dashboard` shows a landing with "Continue with Google" (`/auth/google`, handled by `lib/google-routes.ts` and `lib/services/google.ts`) and a link to the PCU email link at `/login`. Google needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, with `APP_URL/auth/google/callback` registered as a redirect URI; without them the button returns with "not available". Browser tests sign in with `authenticate` from `e2e/helpers.ts`, which uses the session that `e2e/seed-auth.ts` stores; `authenticate(page, "admin")` signs in as the seeded admin for `/admin`.

## Design system

`DESIGN.MD` in the repo root is the source of truth: white and ink, Geist Mono slash labels and numbered navigation, hairline borders, and the motion tokens in `app/globals.css`. Read it before restyling anything.

## Checks

CI runs lint, typecheck, unit tests, a migration-drift check and the build, then a separate Playwright job. Run the same before opening a pull request:

```
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

- Playwright builds and serves the production app on port 3100. Test against a build, because the dev server compiles routes on first visit and clicks land before hydration.
- A change to `lib/db/schema.ts` needs `npm run db:generate` and the generated `drizzle/` files in the same commit.

## Git

- `main` takes changes through pull requests only.
- Commit messages, pull requests and issues carry no Claude mention and no `Co-Authored-By` line.
- `chapter2.md` in the repo root is an unrelated thesis chapter. Leave it out of commits.
