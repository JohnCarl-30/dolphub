# PCU Community: Architecture and Decision Log

Last updated: 2026-10-17. Produced from a design review ("grill me") session before any code was written.

## What it is

A showcase site where PCU **tech students** each get a public portfolio page at `/u/<handle>` showing their projects, with a Messenger link, and optionally a GitHub link and a contact email, for contact. Admins also post opportunities: internships, events, competitions and programs.

Not a marketplace. No payments happen on the platform, and students pay nothing.

## Target and timeline

| Item | Value |
|---|---|
| Audience | PCU tech students (IT, CS, Computer Engineering), about 200 enrolled |
| Success metric | Profiles with at least one project |
| Target | 50 profiles by end of first semester (mid-December 2026) |
| Midpoint check | 15 profiles by late November, or change the plan |
| Soft launch | Week of 2026-10-19, about 10 invited tech classmates |
| Public launch | 2026-11-07 |

The metric is one count query shown on the admin page. No tracking script, no cookie banner.

## Stack

| Layer | Choice | Free-tier notes |
|---|---|---|
| App | Next.js (App Router), TypeScript, Tailwind | Phone-first layouts |
| Hosting | Vercel | Function request bodies are capped at 4.5 MB |
| Database | Neon Postgres, through Drizzle ORM and Neon's HTTP driver | About 0.5 GB storage. Compute suspends when idle, so cold starts are possible. The HTTP driver needs no pooler, because it holds no connections open |
| Images | Cloudflare R2 | 10 GB free, no egress fees |
| Email | Resend, sending from `login@dolphub.tech` | About 3,000 per month and **100 per day** |
| Domain | `dolphub.tech` | Site and sign-in links at `https://dolphub.tech` |

## Decisions

1. **Showcase before opportunities.** Profiles ship first, at the soft launch. Opportunities follow before the public launch.
2. **One link per student, no subdomains.** Each page lives at `/u/<handle>`, and that link is what students share in bios, resumes and chats. There are no subdomains and no fees.
3. **Tech students only.** Signup is gated by PCU email domain. Course comes from a fixed tech-only list the owner maintains. Non-tech students are stopped at the course step with a "not supported yet" message.
4. **Pages stay after graduation.** A recovery email will be added before the first graduating class. It is not needed at launch.
5. **Images.** Max 10 per student, max 500 KB each after compression. The browser compresses first, which is required because of the Vercel 4.5 MB body limit. The server then checks type, size and the per-student count, and re-encodes with sharp. Only R2 keys are stored in Postgres, never image bytes.
6. **Contact by link.** Messenger is the main way to reach a student. A student can also add a GitHub username and a public contact email, both optional and empty by default. The email is never taken from the sign-in address and never goes into structured data, previews or logs. No prices or payments handled by the platform.
7. **Projects need links.** Each project has optional demo and source code URLs, which must be valid `https` links.
8. **Public pages are static.** `/u/<handle>` uses ISR and revalidates when the owner saves, so visitors never wait on a Neon cold start.
9. **Link previews.** `generateMetadata` sets title, tagline and image. The preview image is the chosen cover, or else the first image of the first project. The image URL carries an `updated_at` version so changed photos refresh. Stuck previews are refreshed with Facebook's Sharing Debugger.
10. **Grid.** Only profiles with at least one project appear, newest first. When it is empty, the grid shows a "be the first" card.
11. **Handles are permanent.** A blocklist reserves names like `admin`, `api`, `login` and `pcu`. Typo fixes are done by the admin on request.
12. **Moderation.** The admin can hide any profile and freeze signups from a phone. Later, a report button auto-hides a profile after 3 distinct reporters and notifies the owner.
13. **Deletion removes everything.** Order of operations: mark deleted in Neon, delete R2 objects, purge the cache. A nightly sweep removes orphaned R2 keys. Reports survive with the profile reference nulled, so repeat offenders keep their history.
14. **Opportunities.** Internships and OJT, events, competitions and programs, each with a link to apply or register. Only admins post. A post leaves the list when it closes: at its deadline, or else its end time, or else its start time, in Philippine time. Dolphub stores nothing about which students opened or applied to a post. Full plan in [OPPORTUNITIES.md](./OPPORTUNITIES.md).
15. **Backend and frontend are split by owner.** JohnCarl-30 owns the backend: the database, sign-in, the upload pipeline, server actions and API routes, page refreshes, and admin and moderation logic, in `lib/` and the `actions.ts` files. fnzh-i owns the frontend: pages and components under `app/`, including the dashboard screens, the public page and grid layout, browser image compression, and phone testing. Server actions with typed results are the contract between them.
16. **One service layer.** All reads and writes live in plain functions under `lib/services/`. Server actions, API routes and MCP servers are thin wrappers over them, so logic is written once.
17. **MCP servers, in two stages. Proposed, not yet confirmed.** Both use Vercel's `mcp-handler` in Next.js route handlers and call the service layer. Neither calls a model, so neither adds AI cost.
    - **Admin MCP (by 2026-11-21):** private, bearer-token auth, used from Claude Code. Tools for stats, hiding pages, freezing signups, posting opportunities and deleting accounts. Every write is recorded in `admin_audit_log`. The phone kill switch stays on the admin web page, because claude.ai and the phone apps need OAuth.
    - **Public directory MCP (January 2027):** read-only, rate-limited, opt-in profiles only. Tools to search students, get one student, and list open opportunities. Student-written text is returned as length-capped data. It waits for 50 profiles and the opt-in toggle.
18. **Drizzle ORM with Neon's HTTP driver.** Schema lives in `lib/db/schema.ts`, and migrations are generated into `drizzle/`. Tests run the real migrations against PGlite, an in-memory Postgres, so they need no accounts or network.
19. **Signup domains are configuration.** `PCU_EMAIL_DOMAINS` lists the allowed email domains, matched exactly. The real PCU student email domain still needs confirming.
20. **Custom magic-link sign-in instead of Auth.js.** The emailed link opens a page with a button, and only the button press uses the link. University mail scanners often open links before the student does, which would use up a link that signs in on open. Links last 15 minutes and work once. Sessions last 30 days in an httpOnly `__Host-session` cookie. Only hashes of links and session tokens are stored.
21. **Local development needs no accounts.** `DATABASE_URL=pglite:<folder>` runs Postgres inside Node, and without `RESEND_API_KEY` sign-in links print to the terminal. Production refuses to start without Neon, Resend, R2 and an https `APP_URL`.
22. **Search indexing.** The home page is indexed. Student pages are indexed by default once they show real data, and each student can turn that off with a "show my page in search engines" setting stored in `profiles.search_visible`. Sample profiles are never indexed. Every page gets its own canonical link, and student pages get a generated 1200x630 link preview with their name, course and tagline. Search logic lives in `lib/seo.ts` and `lib/seo-data.ts`.

## Data model (launch)

Defined in `lib/db/schema.ts`.

- `users`: id, email (lowercase, unique), is_admin, created_at, deleted_at
- `courses`: id, name, active (tech list, admin-maintained)
- `profiles`: id, user_id (one per user), handle (unique, lowercase, permanent), display_name, tagline (up to 100 chars), course_id, messenger_url, github_username (nullable), contact_email (nullable, public, lowercase), cover_image_id (nullable), is_hidden, hidden_reason, search_visible (default true), created_at, updated_at
- `projects`: id, profile_id, title, description, demo_url, source_url, sort_order, created_at, updated_at
- `images`: id, project_id, profile_id (for the per-student cap), r2_key, width, height, bytes, sort_order, created_at
- `app_settings`: one row holding signups_frozen
- `admin_audit_log`: actor_user_id, action, target (an id, never a name), reason, created_at
- `login_tokens`: email, token_hash, expires_at, used_at, created_at
- `sessions`: user_id, token_hash, expires_at, created_at

Added before the public launch: `opportunities` (see OPPORTUNITIES.md).

Added after launch: `profiles.recovery_email`, `profiles.in_directory` (opt-in for the public MCP, default false), `reports`.

## Routes (launch)

| Route | Purpose |
|---|---|
| `/` | Grid of profiles with at least one project |
| `/u/[handle]` | Public profile page, ISR, preview tags |
| `/login` | Email form that sends a sign-in link |
| `/auth/verify` | Where the emailed link lands. A button finishes sign-in |
| `/dashboard` | Authenticated community feed with session-only post interactions |
| `/profile` | Owner edits profile and projects, phone-first. Signed-in only |
| `/api/upload` | Validates, re-encodes and stores an image in R2 |
| `/admin` | Profile count metric, hide profile, freeze signups |

Added later: `/api/mcp/admin` for the admin MCP server, and `/api/mcp` for the public directory MCP server.

## Launch cut list

**Ships for the soft launch:** PCU email magic-link sign-in, profile editing, projects with images and links, image upload, public page with previews, plain grid, admin hide switch.

**Cut until after launch:**

- Course search. Course is still stored.
- Report button and auto-hide. Replaced by a "report this page" link to the admin.
- Self-serve account deletion. Done by hand on request, within days.
- Recovery email.

## Open items and risks

Ordered by danger.

1. **Email deliverability untested.** Sign-in is built, but no real email has reached a PCU inbox yet. Verify `dolphub.tech` in Resend, then send a sign-in link to a PCU address and check inbox versus spam. Resend's 100-per-day cap also limits launch-day signups, and the site stops at `DAILY_EMAIL_CAP`.
2. **PCU mailbox coverage.** Confirm with PCU IT that every tech student has a mailbox, and whether it survives graduation.
3. **Bus factor of one.** Add fnzh-i as a second owner on Vercel, Cloudflare, Neon, Resend and the domain, and keep a runbook in this repo.
4. **Phone upload untested.** Test compression with a real 4 MB photo on a budget Android phone on campus wifi. Test that a backgrounded tab shows a clear retry, not a silent empty slot.
5. **Handle typos.** Consider allowing one handle change within 24 hours of signup.
6. **Frontend and backend drift apart.** With two people building in parallel, a changed action signature can break screens silently. Keep action inputs and results typed, list them in `docs/BACKEND.md`, and change them only in a pull request both people see.
7. **MCP package versions.** `mcp-handler` 2.x needs the v2 MCP SDK packages and Node 20 or newer, and 1.x pairs with `@modelcontextprotocol/sdk` 1.x. Check the README when building, and use SDK 1.26.0 or later on 1.x because of a known security issue in earlier versions.
8. **Sign-in email limits.** Sign-in links are limited per address, per network and per day, to stay within Resend's free tier. If the daily limit is reached, sign-in pauses until it clears. Adding a challenge to the sign-in form is the next step if the limits are not enough.
