# PCU Community: Architecture and Decision Log

Last updated: 2026-10-17. Produced from a design review ("grill me") session before any code was written.

## What it is

A showcase site where PCU **tech students** each get a public portfolio page at `/u/<handle>` showing their projects, with a Messenger link for contact. Later, the owner posts tech internship openings.

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
| Email | Resend | About 3,000 per month and **100 per day** |

## Decisions

1. **Showcase before opportunities.** Profiles ship first. Internship posts come later.
2. **One link per student, no subdomains.** Each page lives at `/u/<handle>`, and that link is what students share in bios, resumes and chats. There are no subdomains and no fees.
3. **Tech students only.** Signup is gated by PCU email domain. Course comes from a fixed tech-only list the owner maintains. Non-tech students are stopped at the course step with a "not supported yet" message.
4. **Pages stay after graduation.** A recovery email will be added before the first graduating class. It is not needed at launch.
5. **Images.** Max 10 per student, max 500 KB each after compression. The browser compresses first, which is required because of the Vercel 4.5 MB body limit. The server then checks type, size and the per-student count, and re-encodes with sharp. Only R2 keys are stored in Postgres, never image bytes.
6. **Contact by Messenger link only.** No prices or payments handled by the platform.
7. **Projects need links.** Each project has optional demo and source code URLs, which must be valid `https` links.
8. **Public pages are static.** `/u/<handle>` uses ISR and revalidates when the owner saves, so visitors never wait on a Neon cold start.
9. **Link previews.** `generateMetadata` sets title, tagline and image. The preview image is the chosen cover, or else the first image of the first project. The image URL carries an `updated_at` version so changed photos refresh. Stuck previews are refreshed with Facebook's Sharing Debugger.
10. **Grid.** Only profiles with at least one project appear, newest first. When it is empty, the grid shows a "be the first" card.
11. **Handles are permanent.** A blocklist reserves names like `admin`, `api`, `login` and `pcu`. Typo fixes are done by the admin on request.
12. **Moderation.** The admin can hide any profile and freeze signups from a phone. Later, a report button auto-hides a profile after 3 distinct reporters and notifies the owner.
13. **Deletion removes everything.** Order of operations: mark deleted in Neon, delete R2 objects, purge the cache. A nightly sweep removes orphaned R2 keys. Reports survive with the profile reference nulled, so repeat offenders keep their history.
14. **Internship posts.** Company, role, deadline and link only. Only the admin posts. They expire by query (`deadline >= today`), with no cron job.
15. **The project owner focuses on backend, not frontend.** That covers the database, sign-in, the upload pipeline, server actions and API routes, page revalidation, and admin and moderation logic. Frontend work has no owner yet. That means the dashboard screens, the public page and grid layout, browser image compression, and phone testing.
16. **One service layer.** All reads and writes live in plain functions under `lib/services/`. Server actions, API routes and MCP servers are thin wrappers over them, so logic is written once.
17. **MCP servers, in two stages. Proposed, not yet confirmed.** Both use Vercel's `mcp-handler` in Next.js route handlers and call the service layer. Neither calls a model, so neither adds AI cost.
    - **Admin MCP (by 2026-11-21):** private, bearer-token auth, used from Claude Code. Tools for stats, hiding pages, freezing signups, posting internships and deleting accounts. Every write is recorded in `admin_audit_log`. The phone kill switch stays on the admin web page, because claude.ai and the phone apps need OAuth.
    - **Public directory MCP (January 2027):** read-only, rate-limited, opt-in profiles only. Tools to search students, get one student, and list internships. Student-written text is returned as length-capped data. It waits for PCU approval, 50 profiles, and the opt-in toggle.
18. **Drizzle ORM with Neon's HTTP driver.** Schema lives in `lib/db/schema.ts`, and migrations are generated into `drizzle/`. Tests run the real migrations against PGlite, an in-memory Postgres, so they need no accounts or network.
19. **Signup domains are configuration.** `PCU_EMAIL_DOMAINS` lists the allowed email domains, matched exactly. The real PCU student email domain still needs confirming.

## Data model (launch)

Defined in `lib/db/schema.ts`.

- `users`: id, email (lowercase, unique), is_admin, created_at, deleted_at
- `courses`: id, name, active (tech list, admin-maintained)
- `profiles`: id, user_id (one per user), handle (unique, lowercase, permanent), display_name, tagline (up to 100 chars), course_id, messenger_url, cover_image_id (nullable), is_hidden, hidden_reason, created_at, updated_at
- `projects`: id, profile_id, title, description, demo_url, source_url, sort_order, created_at, updated_at
- `images`: id, project_id, profile_id (for the per-student cap), r2_key, width, height, bytes, sort_order, created_at
- `app_settings`: one row holding signups_frozen
- `admin_audit_log`: actor_user_id, action, target (an id, never a name), reason, created_at

Added after launch: `profiles.recovery_email`, `profiles.in_directory` (opt-in for the public MCP, default false), `reports`, `internships`.

## Routes (launch)

| Route | Purpose |
|---|---|
| `/` | Grid of profiles with at least one project |
| `/u/[handle]` | Public profile page, ISR, preview tags |
| `/dashboard` | Owner edits profile and projects, phone-first |
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
- Internship posts.

## Open items and risks

Ordered by danger.

1. **Not sanctioned by PCU.** Talk to student affairs or a faculty adviser before the public launch on 2026-11-07.
2. **Email deliverability untested.** Send a test from Resend to a PCU address before writing sign-in code. Resend's 100-per-day cap also limits launch-day signups.
3. **PCU mailbox coverage.** Confirm with PCU IT that every tech student has a mailbox, and whether it survives graduation.
4. **Bus factor of one.** Add a second owner on Vercel, Cloudflare, Neon, Resend and the domain, and keep a runbook in this repo.
5. **Phone upload untested.** Test compression with a real 4 MB photo on a budget Android phone on campus wifi. Test that a backgrounded tab shows a clear retry, not a silent empty slot.
6. **Handle typos.** Consider allowing one handle change within 24 hours of signup.
7. **Frontend has no owner.** The owner is focusing on backend. Find a frontend collaborator before the build week's screen tasks, or use a ready-made component kit and keep screens plain. A collaborator could also become the second account owner in item 4.
8. **MCP package versions.** `mcp-handler` 2.x needs the v2 MCP SDK packages and Node 20 or newer, and 1.x pairs with `@modelcontextprotocol/sdk` 1.x. Check the README when building, and use SDK 1.26.0 or later on 1.x because of a known security issue in earlier versions.
