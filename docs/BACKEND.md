# Backend Services

All business rules live in `lib/services/`. The services are plain TypeScript with no Next.js imports. Server actions, API routes, and later the MCP servers are thin wrappers that call them.

## How to call a service

From server code only, such as a server action or a route handler:

```ts
import { getServiceContext } from "@/lib/server";
import { createProject } from "@/lib/services";

const ctx = await getServiceContext();
const { project, handle } = await createProject(ctx.db, userId, { title: "My app" });
```

Never import `lib/server.ts` or `lib/services` from a client component. `lib/server.ts` fails the build if you try.

**After any write that returns a `handle`,** refresh that student's cached page, for example with `revalidatePath("/u/" + handle)`. Services stay free of Next.js, so they cannot do this themselves.

## Dashboard: server actions for the frontend

These are the contract between backend (JohnCarl-30) and frontend (fnzh-i). Backend owns `lib/` and the `actions.ts` files. Frontend owns pages and components under `app/`. Change an action's input or result only in a pull request both people see.

### Loading the dashboard

In a Server Component inside a `<Suspense>` boundary:

```tsx
import { getDashboard } from "@/lib/dashboard";

async function Dashboard() {
  const d = await getDashboard(); // redirects to /login when signed out
  if (!d.profile) return <CreateProfileForm courses={d.courses} />;
  // d.profile, d.projects (each with images), d.imageCount, d.imageLimit, d.email
}
```

`d.profile.isHidden` is true when an admin has hidden the page. Show the student `d.profile.hiddenReason`.

`d.profile.searchVisible` is the student's "show my page in search engines" setting, on by default. Give it a toggle that calls `updateProfileAction({ searchVisible })`, and explain at signup that pages are public and searchable unless turned off.

### Result shape

Every action returns an `ActionResult` from `lib/actions/result.ts` and never throws for expected problems:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };
```

`error` is safe to show. When `field` is set, show the message next to that input. Field names match the input names below.

### Actions in `app/dashboard/actions.ts`

| Action | Input | Returns on success |
|---|---|---|
| `checkHandleAction(handle)` | The handle being typed | `{ available }`. A reserved or badly formed handle returns an error instead |
| `createProfileAction(input)` | `handle`, `displayName`, `courseId`, optional `tagline`, `messengerUrl`, `githubUsername` and `contactEmail` | `{ handle }` |
| `updateProfileAction(input)` | Only the changed fields: `displayName`, `tagline`, `courseId`, `messengerUrl`, `githubUsername`, `contactEmail`, `coverImageId`, `searchVisible` | `{ handle }` |
| `createProjectAction(input)` | `title`, optional `description`, `demoUrl`, `sourceUrl` | `{ projectId }` |
| `updateProjectAction(projectId, input)` | Only the changed fields, plus `sortOrder` | `null` |
| `deleteProjectAction(projectId)` | | `null` |
| `deleteImageAction(imageId)` | | `null` |

Rules the actions enforce, so the frontend doesn't have to:

- **Signed out:** the action redirects to `/login`.
- **Text limits:** name up to 60 characters, tagline 100, project title 80, description 1,000.
- **Links:** project links must be `https`, and the Messenger link must be `https://m.me/...` or `https://www.messenger.com/...`. A link typed without a scheme, such as `jeep.example.com` or `m.me/juan`, gets `https://` added. `http://` links are still refused. An empty string clears an optional field.
- **GitHub:** `githubUsername` takes a bare username or a pasted `https://github.com/<username>` link, and stores the username only. It is 1 to 39 letters, digits or single hyphens, with no hyphen at either end. The page builds the link as `https://github.com/<username>`.
- **Contact email:** `contactEmail` is stored lowercase, up to 254 characters, any domain. It is separate from the sign-in email and is empty until the student adds one. It shows to anyone on the public page, so the dashboard must say so. It must stay out of structured data, link previews, the sitemap and logs.
- **Course:** `courseId` may be a number or the text from a `<select>`, such as `"3"`.
- **Handle:** cannot change after creation. When a typed handle is badly formed, the create form offers `suggestHandle` from `handles.ts`, which turns a name like "Juan Dela Cruz" into `juan-dela-cruz`.
- **Refresh:** every successful write refreshes the student's public page and the home grid.

### Using an action from a form

```tsx
"use client";
import { useActionState } from "react";
import { createProjectAction } from "@/app/dashboard/actions";

const [state, submit, pending] = useActionState(
  async (_prev: unknown, form: FormData) =>
    createProjectAction({
      title: String(form.get("title") ?? ""),
      demoUrl: String(form.get("demoUrl") ?? ""),
    }),
  null,
);
// state?.ok === false -> show state.error, next to state.field when set
```

React clears a form after an action runs. To keep what the student typed after an error, set each input's `defaultValue` from the submitted values.

### The editor at `/profile`

`app/profile/page.tsx` loads `getDashboard()`. Without a profile it shows the create form, which checks the handle as the student types. With one it shows the editor. On save, `lib/profile-form.ts` works out which profile fields changed and which projects to create, update or delete, and the editor sends only those. It records each step that succeeds, so retrying after an error never creates a project twice.

Photos don't wait for "Save changes". `app/profile/project-photos.tsx` uploads a photo the moment it is chosen and removes one with `deleteImageAction`. A project needs saving before it can take photos, because the upload names the project id.

### Photo upload at `/api/upload`

Server actions accept 1 MB bodies, so photos go through a route instead. Send a multipart form with `projectId` and `image`. The answer has the same shape as an action result, `{ ok: true, data: { image } }` or `{ ok: false, error, field? }`, with the status from the error table below. The route also refuses requests whose `Origin` isn't `APP_URL` (403), signed-out visitors (401) and bodies over 4 MB (413). It expires the student's page and the home grid, so the photo shows on the next visit.

Call it through `uploadPhoto` and `preparePhoto` in `lib/photo-upload.ts`. `preparePhoto` sends JPEG, PNG and WebP files under 3.5 MB as they are. Anything larger, or in another format such as HEIC, is redrawn as a JPEG no wider than 2400 px, with the camera's rotation applied. The route's logic lives in `lib/upload-route.ts`, so tests can run it with a fake context.

Without R2 settings, photos are kept in server memory and served from `/dev-images/<key>`. They vanish when the server restarts. With R2 set, that route answers 404.

## Opportunities

The plan is in [OPPORTUNITIES.md](./OPPORTUNITIES.md). Admins post, students follow the link out.

**The apply link needs sign-in.** Anyone can read a post, but only signed-in students see its `url`. Signed out, `/opportunities/<slug>` shows "Sign in to apply" with the Google and email options, and both return to the post. The `url` is left out of every page a signed-out visitor can open: the home page gets `getOpenOpportunityPreviews()` (the `OpportunityPreview` type, without `url`), its cards and focus band link to the post page, and the structured data points online events at the post page.

### Loading

From a Server Component inside a `<Suspense>` boundary:

```tsx
import { notFound } from "next/navigation";
import { getOpenOpportunities, getOpportunityPage } from "@/lib/opportunities";

const posts = await getOpenOpportunities(kind); // kind from the tab or ?kind=, or nothing for all
const post = await getOpportunityPage(slug); // null when missing or hidden: call notFound()
```

| Loader | Returns |
|---|---|
| `getOpenOpportunities(kind?)` | Open posts, soonest closing first. Unknown kinds mean all |
| `getOpportunityPage(slug)` | One post plus `isClosed`. Closed posts are still returned, so show "This opportunity has closed" |
| `getAdminOpportunities()` | Every post including hidden and closed, with `id`, `isHidden`, `hiddenReason`, `isClosed`. Admins only |

Both public loaders wait for the request and then read a cached copy, so pages never touch the database at build time. A post leaves the list the moment it closes. The home page passes `getOpenOpportunityPreviews()` unawaited to the client, which picks the next three posts and the focus band post (closing within three days) with `upcomingOpportunities` and `focusOpportunity` from `lib/opportunity-display.ts`, using the visitor's clock.

Each post (`PublicOpportunity` in `lib/services/opportunities.ts`) has these fields:

- `slug`, `kind`, `title`, `organization`, `summary`
- `url`, which is where to apply or register
- `locationType` and `location`
- `startsAt`, `endsAt`, `deadline` and `closesAt`, as `Date` objects
- `createdAt` and `updatedAt`

`kind` is `internship`, `event`, `competition` or `program`, and `KIND_LABELS` has the display names. `locationType` is `onsite`, `online` or `hybrid`.

### Showing dates

Use `lib/opportunity-time.ts` so every date shows in Philippine time, whatever the server's time zone:

| Function | Example |
|---|---|
| `closingLabel(closesAt)` | "Closes today", "Closes tomorrow", "Closes in 3 days", "Closes Nov 20", "Closed" |
| `formatManilaDate(date)` | "Oct 30", or "Jan 5, 2027" in another year |
| `formatManilaTime(date)` | "2:00 PM" |

### Search and sharing for the pages

```tsx
import { getOpportunityPage } from "@/lib/opportunities";
import { JsonLd } from "@/lib/json-ld";
import { missingOpportunityMetadata, opportunityJsonLd, opportunityMetadata, siteUrl } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const post = await getOpportunityPage((await params).slug);
  return post ? opportunityMetadata(post, post.isClosed) : missingOpportunityMetadata();
}
// In the page body: const ld = opportunityJsonLd(post, siteUrl(), post.isClosed); if (ld) <JsonLd data={ld} />
```

- **List page:** use `opportunitiesListMetadata()`.
- **Preview image:** each post gets one automatically, from `app/opportunities/[slug]/opengraph-image.tsx`.
- **Sitemap:** when the pages ship, set `OPPORTUNITY_PAGES_LIVE` to `true` in `lib/seo.ts`. That adds the list page and every open post.

### Admin actions in `app/admin/opportunities/actions.ts`

| Action | Input | Returns on success |
|---|---|---|
| `createOpportunityAction(input)` | `kind`, `title`, `organization`, `summary`, `url`, optional `locationType` (default `onsite`), `location`, `startsAt`, `endsAt`, `deadline` | `{ id, slug }` |
| `updateOpportunityAction(id, input)` | Only the changed fields. An empty date clears it | `{ slug }` |
| `setOpportunityHiddenAction(id, hidden, reason?)` | A reason is required to hide | `{ slug }` |
| `deleteOpportunityAction(id, confirm)` | `confirm` must be `true`. Prefer hiding | `{ slug }` |

Rules the actions enforce:

- **Admins only.** Everyone else gets "Admins only".
- **Date formats.** `"2026-10-30"` means 11:59 pm that day, and `"2026-10-30T14:00"`, which is what a `datetime-local` input sends, means 2 pm, both in Philippine time.
- **Dates each kind needs.** Internships and programs need a `deadline`. Events need `startsAt`. Competitions need a `deadline` or `startsAt`.
- **Date order.** `endsAt` needs `startsAt` and must come after it.
- **No closed posts.** A new post can't already be closed.
- **Text and links.** Title up to 120 characters, organization 80, summary 500, place 120. The link must start with `https://`.
- **Slugs never change.** Shared links keep working after edits.
- **Audit log and refresh.** Every write is recorded in the audit log and refreshes the public lists.

Admin stats (`getStats`) now include `openOpportunities` per kind, for the launch gate of 10 across 3 kinds.

## Search and link previews

Metadata, link preview images, structured data and the sitemap live in backend-owned files. Pages only call them.

| File | Holds |
|---|---|
| `lib/seo.ts` | Site name and colors, titles, descriptions, the "may this page be indexed" rule, and JSON-LD builders. Pure functions with tests |
| `lib/seo-data.ts` | The one place metadata gets profile data. It reads the same cached copy as the page |
| `lib/share-card.tsx` | The 1200x630 preview card design |
| `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts` | Crawler rules, sitemap, web manifest |
| `app/opengraph-image.tsx`, `app/u/[handle]/opengraph-image.tsx` | Site preview and per-student preview |
| `app/icon.tsx`, `app/apple-icon.tsx` | Browser tab and home screen icons |

Indexing rules:

- **Home** is indexed.
- **Student pages** are indexed only when the data is real and the student left `searchVisible` on. Sample pages and unknown handles get `noindex`.
- **Login, verify, dashboard and profile editor** always get `noindex`. `robots.txt` blocks `/dashboard`, `/profile`, `/auth/` and `/api/`, but not `/login` or `/u/`, so crawlers can still see their `noindex`.

Student pages read the database. Cover photos still stay out of the preview card, because they are WebP, which the preview generator can't draw. Convert them to PNG with sharp first to add them.

## Errors

Services throw `ServiceError` for expected problems. Its `message` is safe to show users, and `field` names the form field when there is one. Anything else is a bug or an outage.

| Code | Meaning | HTTP status |
|---|---|---|
| `VALIDATION` | Bad input | 400 |
| `FORBIDDEN` | Not allowed, such as a non-PCU email or a non-admin | 403 |
| `NOT_FOUND` | Missing, or belongs to someone else | 404 |
| `CONFLICT` | Handle taken, or profile already exists | 409 |
| `LIMIT_REACHED` | 10-image cap reached | 409 |
| `SIGNUPS_FROZEN` | Admin has paused new signups | 503 |
| `UNAVAILABLE` | An outside service failed, such as Resend | 503 |

Another user's project or image returns `NOT_FOUND`, not `FORBIDDEN`, so ids are never confirmed to strangers.

### Logging

Student email addresses must never reach the server logs. Log unexpected errors with `logError(context, error)` from `lib/log.ts`, never `console.error(error)`.

`logError` keeps the error name, message, Postgres code and the start of the stack. It drops Drizzle's `params:` line, which holds query values such as the email, and masks any email address. That covers addresses an outside service like Resend echoes back. `toActionError` already uses it, so server actions are covered.

## Services

### Sign-in (`auth.ts` and `signup.ts`)

Students sign in with a one-time link emailed through Resend. The link opens a page with a "Continue" button, and only the button uses the link. Mail scanners that open links in advance therefore cannot use it up.

**Returning after sign-in.** `/login`, `/auth/google` and `/dashboard` take `?next=<path>`, such as an opportunity page. The email flow carries it in the emailed link and the verify form; the Google flow keeps it in the attempt cookie, including on the way back after a failure. A signed-in visit to `/dashboard?next=` goes straight there. `safeNextPath` in `lib/next-path.ts` only accepts plain paths on this site, so a crafted link cannot send anyone elsewhere.

| Function | Does |
|---|---|
| `requestSignInLink(ctx, sender, settings, email, clientIp?, next?)` | Emails a link to `APP_URL/auth/verify`, with `next` when it is a safe path. Existing users can always ask. New addresses must pass the domain check and open signups. Limits: 3 links per address per 15 minutes, `SIGNIN_LINKS_PER_NETWORK_PER_HOUR` per network, and `DAILY_EMAIL_CAP` per 24 hours. Networks are stored only as a keyed hash |
| `consumeSignInLink(ctx, settings, token)` | Uses the link once, creates the account if needed, and returns a 30-day session token |
| `startGoogleSignIn(settings)` | Builds Google's consent URL with PKCE, a state value and a nonce, and returns them for a 10-minute cookie. `GET /auth/google` sets that cookie and redirects |
| `finishGoogleSignIn(ctx, settings, { code, state, attempt })` | `GET /auth/google/callback`. Checks the state, trades the code for an ID token, checks its issuer, audience, expiry, nonce and verified email, then signs in or registers under the same domain and frozen-signup rules as email links. Failures return to `/dashboard?signin=<reason>` |
| `startSession(ctx, user)` | Starts a 30-day session. Used by both sign-in methods |
| `getSessionUser(ctx, token)` | The user behind a session token, or null if expired or the account is being deleted |
| `signOut(ctx, token)` | Ends that session |
| `purgeExpiredAuthRecords(ctx)` | Nightly job. Removes old links and expired sessions |
| `isAllowedSignupEmail(email, domains)` | Exact domain match against `PCU_EMAIL_DOMAINS` |
| `signInOrRegister(db, email, domains)` | Used by `consumeSignInLink`. Existing users always get in. New users need a PCU address and open signups |

Links and session tokens are stored only as SHA-256 hashes.

In pages and actions, use the helpers in `lib/auth.ts`:

| Helper | Does |
|---|---|
| `getCurrentUser()` | The signed-in user or null. Use it inside a `<Suspense>` boundary |
| `requireUser()` | The signed-in user, or a redirect to `/login`. Call it in every protected page and server action |
| `setSessionCookie` and `clearSessionCookie` | Only from server actions or route handlers |

### Profiles (`profiles.ts`)

| Function | Does |
|---|---|
| `listActiveCourses(db)` | Courses for the signup dropdown |
| `isHandleAvailable(db, handle)` | For live checking while typing. Throws `VALIDATION` on a badly formed or reserved handle |
| `createProfile(db, userId, input)` | Handle, name, course, optional tagline, Messenger link, GitHub username and contact email. Handle is permanent |
| `updateProfile(db, userId, patch)` | Name, tagline, course, Messenger link, GitHub username, contact email, cover image. Rejects a handle change |
| `getProfileByUserId(db, userId)` | The dashboard's own profile, or null |
| `getPublicProfile(ctx, handle)` | Everything `/u/<handle>` shows, with image URLs and the preview cover. Null when missing, hidden, or being deleted. `updatedAt` is the preview image version |
| `listGridProfiles(ctx, { limit, after })` | Home grid: visible profiles with a project, newest first. Pass the last card's `createdAt` and `id` as `after` for the next page |

### Projects (`projects.ts`)

| Function | Does |
|---|---|
| `createProject(db, userId, input)` | Title, description, demo and source links, which must be `https` |
| `updateProject(db, userId, projectId, patch)` | Same fields plus `sortOrder` |
| `deleteProject(ctx, userId, projectId)` | Removes the project, its images, and their R2 files |

### Images (`images.ts`)

| Function | Does |
|---|---|
| `addProjectImage(ctx, userId, projectId, bytes)` | Accepts JPEG, PNG or WebP under 4 MB. Re-encodes to WebP under 500 KB, fixes rotation, removes metadata such as GPS, stores in R2. Enforces 10 per student |
| `deleteImage(ctx, userId, imageId)` | Removes the row, then the R2 file |
| `sweepOrphanedImages(ctx)` | Nightly job. Deletes R2 files with no row that are over an hour old |

Browsers compress photos before upload, through `preparePhoto`. Vercel rejects request bodies over 4.5 MB, and phone photos are often bigger.

### Admin (`admin.ts`)

Every function takes the acting user's id and refuses non-admins. Every write is recorded in `admin_audit_log`.

| Function | Does |
|---|---|
| `getStats(ctx, actorId)` | Active profiles against the target of 50, users, signups in the last 7 days, hidden pages, signup switch |
| `listProfilesForAdmin(ctx, actorId, { filter })` | Recent or hidden profiles, with project counts |
| `hideProfile(ctx, actorId, handle, reason)` | Takes a page down. A reason is required |
| `unhideProfile(ctx, actorId, handle)` | Restores a page |
| `setSignupsFrozen(ctx, actorId, frozen, reason?)` | The signup kill switch. Existing users can still sign in |
| `deleteAccount(ctx, { actorUserId, targetUserId, confirm: true })` | Users may delete themselves, and admins may delete anyone. Removes the profile, projects, images and R2 files |
| `deleteAccountByHandle(ctx, actorId, handle, confirmHandle)` | The admin page's delete button. `confirmHandle` must match the handle. Refuses the admin's own account |

The admin page at `/admin` reads these through `lib/admin.ts`. `requireAdminPage()` sends signed-out visitors to `/login` and shows everyone else who is not an admin the ordinary 404. Its actions are in `app/admin/actions.ts`:

| Action | Input | Returns on success |
|---|---|---|
| `hideProfileAction(handle, reason)` | A reason is required. Refreshes the page and the home grid | `{ handle }` |
| `unhideProfileAction(handle)` | | `{ handle }` |
| `setSignupsFrozenAction(frozen, reason?)` | The reason goes to the audit log | `{ frozen }` |
| `deleteAccountAction(handle, confirmHandle)` | The handle, typed by the admin. Refreshes the page and the home grid | `{ handle }` |

Make someone an admin by setting `users.is_admin` to true in the database. There is no screen for it.

## Student pages and the home showcase

From a Server Component inside a `<Suspense>` boundary:

```tsx
import { notFound } from "next/navigation";
import { getProfilePage, getShowcase } from "@/lib/profiles";

const profile = await getProfilePage(handle); // null when missing or hidden: call notFound()
const { cards, courses } = await getShowcase(); // or pass the promise to a client component and use() it
```

| Loader | Returns |
|---|---|
| `getProfilePage(handle)` | `PublicProfile` from `lib/services/profiles.ts`, cached under `profileTag(handle)` |
| `getShowcase()` | Up to 100 grid cards, newest first, each with its first project, plus every active course with a short label for the filter. Cached under `GRID_TAG` |

Both wait for the request and then read a cached copy, so builds never touch the database. Student saves and the admin hide switch expire the tags.

## Nightly cleanup at `/api/cron/cleanup`

`vercel.json` schedules a GET every day at 19:00 UTC, 3 a.m. in Manila. Vercel runs schedules on production deployments only, and sends `Authorization: Bearer <CRON_SECRET>`. The route refuses any other request (401), and every request while `CRON_SECRET` is unset (503).

It runs `sweepOrphanedImages`, then `purgeExpiredAuthRecords`. Each runs even when the other fails. The answer counts what went: `{ ok, images: { deleted, failed }, auth: { loginTokens, sessions } }`, with `null` for a job that failed and status 500 when anything failed. The route's logic lives in `lib/cleanup-route.ts`. To run it by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://dolphub.tech/api/cron/cleanup`.
