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

## Services

### Sign-in (`auth.ts` and `signup.ts`)

Students sign in with a one-time link emailed through Resend. The link opens a page with a "Continue" button, and only the button uses the link. Mail scanners that open links in advance therefore cannot use it up.

| Function | Does |
|---|---|
| `requestSignInLink(ctx, sender, settings, email)` | Emails a link to `APP_URL/auth/verify`. Existing users can always ask. New addresses must pass the domain check and open signups. Limits: 3 links per address per 15 minutes, and `DAILY_EMAIL_CAP` per 24 hours |
| `consumeSignInLink(ctx, settings, token)` | Uses the link once, creates the account if needed, and returns a 30-day session token |
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
| `createProfile(db, userId, input)` | Handle, name, course, optional tagline and Messenger link. Handle is permanent |
| `updateProfile(db, userId, patch)` | Name, tagline, course, Messenger link, cover image. Rejects a handle change |
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

Browsers should still compress photos before upload. Vercel rejects request bodies over 4.5 MB, and phone photos are often bigger.

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

## Still to build

These are Next.js wiring, planned in the build week:

- Server actions for the dashboard, and an upload route that calls `addProjectImage`
- Page revalidation after writes
- A scheduled job that runs `sweepOrphanedImages` and `purgeExpiredAuthRecords` nightly
