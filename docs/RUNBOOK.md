# Runbook

What to do when something goes wrong on dolphub.tech. First-time setup is in the [README](../README.md#production-setup).

## Who holds what

| Service | Used for | Owner | Second owner |
|---|---|---|---|
| Vercel | Hosting, deploys, environment variables, nightly cron | JohnCarl-30 | Not yet |
| Neon | Postgres database | JohnCarl-30 | Not yet |
| Cloudflare | R2 image storage | JohnCarl-30 | Not yet |
| Resend | Sign-in emails | JohnCarl-30 | Not yet |
| dolphub.tech | Domain and DNS | JohnCarl-30 | Not yet |
| GitHub | Code and CI | JohnCarl-30 | fnzh-i can push and merge |

Add fnzh-i as the second owner on each before the public launch. Reports from the "Report this page" link go to the address in `components/support-contacts.tsx`.

## Take a page down

1. Sign in as an admin and open `/admin` on any phone or laptop.
2. Find the handle and choose Hide. Write the reason, such as "scam link" or "reported by 3 students".
3. The page and its home grid card go away at once. Unhide from the same screen.

Hide first and decide later. Hiding keeps the data, so it is always safe.

## Stop new signups

Use the signup freeze on `/admin` when something is wrong with sign-in, the email cap is being burned, or there is a wave of fake accounts. Students who already have accounts can still sign in. Unfreeze from the same switch.

## Sign-in emails stop arriving

1. **Daily cap.** The app stops sending at `DAILY_EMAIL_CAP` (90) emails a day, under Resend's free limit of 100. The cap resets the next day. Freeze signups if a launch post is driving more traffic than that.
2. **One network asking too often.** Campus Wi-Fi shares one address, limited to `SIGNIN_LINKS_PER_NETWORK_PER_HOUR` (30) links an hour. Raise it on Vercel and redeploy if a whole class is signing in together.
3. **Resend.** Check the Resend dashboard for bounces, and that `dolphub.tech` still shows as verified.
4. **Spam.** Ask the student to check spam and mark the email as not spam.

## Make someone an admin

They sign in on the live site once. Then, from a computer with the Neon connection string:

```bash
export DATABASE_URL="<Neon connection string>"
npm run db:make-admin -- them@pcu.edu.ph
```

Admin rights apply on their next page load.

There is no password admin on the live site. The `admin@pcu.edu.ph` / `password` mock admin in the README only works in local development against the `pglite:` database.

## Deploy and roll back

- **Deploy.** Merging a pull request into `main` deploys to production. CI must pass first.
- **Roll back.** In Vercel, open Deployments, pick the last good one, and choose Promote to Production. This takes a minute and does not touch the database.
- **Schema changes.** Run `npm run db:migrate` against Neon before merging code that needs the new tables. A rollback does not undo a migration, so check that the old code still works with the new schema. If public pages show React digest `2605960530` after the project-stars release, follow [the project-stars production handoff](./PROJECT_STARS_BACKEND_HANDOFF.md); the page fallback is temporary protection, not a substitute for migration.
- **Environment variables.** Changes on Vercel only apply after a redeploy. The app refuses to start if Resend, R2, Neon or an https `APP_URL` is missing, so a failed deploy after editing them usually means a typo.

## Nightly cleanup

Vercel runs `/api/cron/cleanup` every day at 19:00 UTC (3 AM in Manila). It deletes orphaned images from R2 and expired sign-in links and sessions. Check it under Vercel's Cron Jobs tab. To run it by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://dolphub.tech/api/cron/cleanup
```

A 500 answer names the job that failed. Either job missing a night is harmless, since the next run catches up.

## A student asks to delete their account

On `/admin`, find their page under Student pages, press **Delete**, type the handle and press **Delete for good**. This removes the account, page, projects and photos, and cannot be undone. The audit log records who did it. Any photo that fails to leave R2 is removed by the nightly cleanup. Self-serve deletion is on the backlog in [PLAN.md](./PLAN.md#backlog-after-launch).

The button only lists accounts that have a page, and it will not delete your own account.

## Free-tier limits to watch

| Service | Limit | What happens |
|---|---|---|
| Resend | 100 emails a day | The app stops at 90. New sign-ins wait until tomorrow |
| Neon | 0.5 GB storage | Writes fail. Images live in R2, so this is far off |
| Cloudflare R2 | 10 GB storage | Uploads fail. At 500 KB an image, this is about 20,000 images |
| Vercel | Hobby plan function and bandwidth limits | Check usage in the Vercel dashboard each Saturday with the profile count |
