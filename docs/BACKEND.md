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
| `createProfileAction(input)` | `handle`, `displayName`, `courseId`, optional `tagline` and `messengerUrl` | `{ handle }` |
| `updateProfileAction(input)` | Only the changed fields: `displayName`, `tagline`, `courseId`, `messengerUrl`, `coverImageId` | `{ handle }` |
| `createProjectAction(input)` | `title`, optional `description`, `demoUrl`, `sourceUrl` | `{ projectId }` |
| `updateProjectAction(projectId, input)` | Only the changed fields, plus `sortOrder` | `null` |
| `deleteProjectAction(projectId)` | | `null` |
| `deleteImageAction(imageId)` | | `null` |

Rules the actions enforce, so the frontend doesn't have to:

- **Signed out:** the action redirects to `/login`.
- **Text limits:** name up to 60 characters, tagline 100, project title 80, description 1,000.
- **Links:** project links must start with `https://`, and the Messenger link must be `https://m.me/...` or `https://www.messenger.com/...`. An empty string clears an optional field.
- **Course:** `courseId` may be a number or the text from a `<select>`, such as `"3"`.
- **Handle:** cannot change after creation.
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

- An upload route that calls `addProjectImage`
- The public page `/u/<handle>` and home grid data, cached under `profileTag(handle)` and `GRID_TAG` from `lib/cache-tags.ts`, which the actions already expire
- Admin actions for the admin page: stats, hide and unhide, and the signup freeze
- A scheduled job that runs `sweepOrphanedImages` and `purgeExpiredAuthRecords` nightly
