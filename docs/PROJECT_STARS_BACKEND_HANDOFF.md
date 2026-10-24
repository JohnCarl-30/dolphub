# Project-stars production handoff

Owner: CJ (backend and production database). This is the recovery procedure for React error digest `2605960530`, which appears when deployed code reads the `project_stars` table before its migration reaches production Neon.

## What the frontend does

The site now degrades only when PostgreSQL reports `42P01` for `project_stars`:

- `/` shows recent published projects instead of a star-ranked list.
- `/u/<handle>` still shows the profile and projects, but star counts and controls are unavailable.
- Other database errors still fail normally; this fallback is not a general database-outage handler.

This protection is temporary. Apply the migration as soon as possible.

Frontend error boundaries separately keep the shared shell and unaffected landing content usable when a Server Component fails. They show a generic Retry state and never expose SQL messages or production digests. They cannot reconstruct projects or profiles that the backend did not return; migration, data fallback, logging, and `starsAvailable` remain backend responsibilities.

## Apply migration 0007

1. In Neon, select the same production branch used by Vercel. Do not paste `DATABASE_URL` into chat, commits, terminal history, or Vercel logs.
2. Confirm the table is missing:

   ```sql
   SELECT to_regclass('public.project_stars');
   ```

   `NULL` means the migration is still needed. If a relation is returned, stop and inspect Vercel Runtime Logs for digest `2605960530`; do not apply the migration twice.

3. From a clean checkout containing `drizzle/0007_youthful_rhino.sql`, set the production connection string only in the current shell and run:

   ```bash
   npm run db:migrate
   ```

4. Verify the schema without exposing row data:

   ```sql
   SELECT to_regclass('public.project_stars');
   SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'project_stars' ORDER BY indexname;
   SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 3;
   ```

   The table, `project_stars_project_id_idx`, and `project_stars_user_id_idx` must exist. The migration journal must contain the new migration.

## Runtime verification

1. Open `/` in a signed-out browser. Featured projects must render without a React 441 error.
2. Open any published `/u/<handle>` page that has projects. The profile and its projects must render with public star counts.
3. Sign in as a different student and star then unstar a project. Confirm the count changes and the landing ranking refreshes.
4. Open the project owner’s session and confirm self-starring is refused.
5. In Vercel Runtime Logs, confirm no new digest `2605960530`, `42P01`, or `project_stars` errors appear after the migration.

## Recovery and sign-off

- The migration is additive. Do not drop `project_stars` to roll back application code.
- If deployment behavior is otherwise broken, promote the last good Vercel deployment; leave the table in place because both old and new application code tolerate it.
- Record: Neon environment/branch, migration command result, schema-check result, browser checks, Vercel-log check, date/time, and CJ’s name.
