# PCU Community: Overall Plan

Last updated: 2026-10-17. The decisions behind this plan are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## At a glance

| | |
|---|---|
| **What** | A public portfolio page at `/u/<handle>` for every PCU tech student, showing their projects |
| **Who** | About 200 PCU tech students (IT, CS, Computer Engineering) |
| **Success** | 50 profiles with at least one project by mid-December 2026 |
| **Soft launch** | Saturday 2026-10-24, to about 10 invited classmates |
| **Public launch** | Saturday 2026-11-07 |
| **Owner's focus** | Backend. Frontend has no owner yet |
| **Budget** | Free tiers only |

## Milestones

| Date | Milestone | Done when |
|---|---|---|
| Sat 2026-10-17 | Accounts and scaffold | App deploys to Vercel, and a test email reaches a PCU inbox |
| Sat 2026-10-24 | Soft launch | About 10 invited classmates can sign in and publish a page |
| Sat 2026-11-07 | Public launch | Every item in the launch gate is checked |
| Sat 2026-11-21 | Admin MCP server | The owner can check stats, hide a page and post internships from Claude |
| Sat 2026-11-28 | Midpoint check | At least 15 profiles with a project, or the plan changes |
| Mid-December 2026 | Semester target | 50 profiles with a project |
| January 2027 | Public directory MCP | Opted-in profiles are searchable from AI assistants |

## Ownership

| Area | Owner | Covers |
|---|---|---|
| Backend | Project owner | Database, sign-in, upload pipeline, server actions and API routes, page revalidation, preview tag data, admin and moderation logic, MCP servers |
| Frontend | **Unassigned** | Dashboard screens, public page and grid layout, browser image compression, phone testing |

Until someone owns the frontend, frontend tasks use a ready-made component kit and plain screens. Finding a frontend collaborator is a Phase 1 task. That person could also be the second account owner.

**One rule for all backend code.** Put every read and write in plain service functions under `lib/services/`, such as `hideProfile` or `countActiveProfiles`. Server actions, API routes and the MCP servers then stay thin wrappers that call the same functions. This keeps the business logic in one place and is what makes Phase 4 cheap.

## Phase 1: Build week (Oct 17 to Oct 24)

One task per day, sized for evenings during classes.

| Day | Task | Area | Done when |
|---|---|---|---|
| Sat Oct 17 | Send a Resend test email to a PCU address. Create Vercel, Neon, R2 and Resend accounts. Scaffold Next.js with TypeScript and Tailwind, and deploy it. Ask around for a frontend collaborator | Backend | The deployed URL loads, and you know whether PCU mail lands in inbox or spam |
| Sun Oct 18 | Database schema for users, courses, profiles, projects and images. Seed the tech course list and the reserved handle blocklist | Backend | Migrations run against Neon through the pooler |
| Mon Oct 19 | Magic-link sign-in through Resend, limited to the PCU email domain. Stop non-tech students at the course step | Backend | A PCU address can sign in, and a non-PCU address cannot |
| Tue Oct 20 | Dashboard, phone-first: pick a handle, then edit name, tagline, course and Messenger link | Frontend, with backend server actions | A signed-in student can save a profile from a phone |
| Wed Oct 21 | Projects with demo and source links. Image upload: browser compression, then server checks, sharp re-encode and R2 storage. Enforce 10 images and 500 KB | Backend, plus frontend for the form and compression | An 11th image and an oversize file are both rejected by the server |
| Thu Oct 22 | Public page `/u/[handle]` with ISR and link preview tags. Home grid of profiles with at least one project | Backend for data and revalidation, frontend for layout | A pasted link shows the right preview in Messenger |
| Fri Oct 23 | Admin page with profile count, hide profile and freeze signups. "Report this page" link. Test on a budget Android phone on campus wifi | Backend, plus frontend for the admin screen | Hiding a page works from a phone, and a real 4 MB photo uploads |
| Sat Oct 24 | **Soft launch** to about 10 classmates, invited by name | Both | Ten invites sent |

**Progress, Oct 17:** the app is scaffolded, and the backend for Sunday's and Monday's tasks is done early. That covers the schema and migrations, the course seed, tested services for profiles, projects, image upload and admin, and working magic-link sign-in through Resend, tested end to end in a browser. What is left for the backend this week is the dashboard's server actions, the upload route, and page refreshes. See [BACKEND.md](./BACKEND.md).

**Still blocking sign-in on the live site:** verify `dolphub.tech` in Resend, set the production environment variables on Vercel, and send one real link to a PCU inbox.

**If behind schedule:** move the soft launch to Oct 31. Do not cut the admin hide switch or the upload limits to make the date.

## Phase 2: Soft launch to public launch (Oct 24 to Nov 6)

- **Fix what testers hit.** Watch the first 10 students sign up and upload. Fix every blocker they report.
- **Talk to PCU.** Meet student affairs or a faculty adviser about using the PCU name. Do this before any public post.
- **Remove the single point of failure.** Add a second owner on Vercel, Cloudflare, Neon, Resend and the domain. Write a one-page runbook in this repo.
- **Prepare the launch post.** Seed the grid with the testers' pages so it is not empty on day one.

### Public launch gate

All must be true before Nov 7:

- [ ] Sign-in email lands in a PCU inbox, not spam
- [ ] Upload works on a budget Android phone, and failed uploads show a retry
- [ ] At least 5 real profiles with a project are live
- [ ] Admin hide switch and signup freeze work from a phone
- [ ] PCU has been told about the project, and has not objected
- [ ] A second person can deploy and use the hide switch

## Phase 3: Public launch and growth (Nov 7 to mid-December)

- **Launch on Nov 7.** Post in tech org pages and class group chats. Resend allows only 100 emails a day, so spread posts over several days or expect a waitlist.
- **Check the count weekly.** Read the profile count on the admin page every Saturday.
- **Build the admin MCP server by Nov 21.** See Phase 4. It is backend-only and replaces admin screens you would otherwise need a frontend for.
- **Midpoint on Nov 28.** Below 15 profiles means changing the approach, such as running a page-building session with a tech org, instead of adding features.
- **Semester end.** Compare against the target of 50, then write a short retrospective in this folder.

## Phase 4: MCP integration

MCP (Model Context Protocol) lets AI assistants such as Claude call tools that your server defines. Your server only answers tool calls. The assistant's owner brings and pays for the model, so an MCP server adds **no AI cost** to this project. It is pure backend work, which matches the owner's focus.

There are two servers, built in this order. Both are Next.js route handlers using Vercel's `mcp-handler` package, and both call the same `lib/services/` functions as the website.

### 4a. Admin MCP server (private, by Nov 21)

**What it is for:** running the site by talking to Claude from your laptop, instead of building admin screens. "How many profiles this week?", "Hide juan's page, it's a scam", "Post the Accenture internship, deadline Dec 5."

| Tool | Does | Writes data |
|---|---|---|
| `get_stats` | Profile count against the 50 target, signups this week | No |
| `list_profiles` | Recent, hidden, or reported profiles | No |
| `hide_profile` / `unhide_profile` | Hides or restores a page, with a reason | Yes |
| `set_signups_frozen` | Freezes or unfreezes new signups | Yes |
| `post_internship` / `remove_internship` | Company, role, deadline and link | Yes |
| `delete_account` | Handles a deletion request: database row, R2 images, cached page | Yes, needs `confirm: true` |

**Rules:**

- **Auth by secret token.** The route rejects any request without the admin bearer token, stored as a Vercel environment variable. Claude Code connects to it with that header. claude.ai and the phone apps need OAuth, which is more work, so the phone kill switch stays on the admin web page.
- **Every write is logged.** Each write tool records who, what, when and why in an `admin_audit_log` table.
- **Internship posts become backend-only.** With `post_internship`, the only screen internships need is the public list.

### 4b. Public directory MCP server (January 2027)

**What it is for:** the long-term "collaborate with other techs" goal. A recruiter or developer asks their AI assistant to "find PCU students who built a Flutter app" and gets real profiles with links back to `/u/<handle>`.

| Tool | Returns |
|---|---|
| `search_students` | Handles, names, taglines and page links, filtered by course or keyword |
| `get_student` | One public profile with its projects and their demo and source links |
| `list_internships` | Open tech internship postings |

**Rules:**

- **Opt-in only.** A student is searchable only after turning on "include my page in AI search" in the dashboard. Being found by AI tools is a new use of their data, so it needs their consent under the Data Privacy Act.
- **Read-only, public data only.** It returns nothing that is not already on the public page. No emails, no hidden profiles.
- **Student text is untrusted.** Taglines and descriptions reach other people's AI assistants. Return them as plain, length-capped data fields, never as instructions.
- **Rate limited.** Use a per-IP limit, because every call counts against Vercel's free tier.

**Wait for these first:** PCU has approved the project, there are at least 50 profiles, and the opt-in toggle exists. An AI directory of four profiles helps nobody.

## Backlog after launch

Built in this order once the public launch is stable:

1. Course search on the home grid
2. Report button that auto-hides a page after 3 distinct reporters and notifies the owner
3. Self-serve account deletion, reusing the `delete_account` service
4. Public internship list page, fed by `post_internship`
5. Recovery email, needed before the first graduating class

## Not doing

- **Payments or a marketplace.** Students link to Messenger. Nobody pays the platform or each other through it.
- **Subdomains.** Every student shares one link, `/u/<handle>`.
- **AI features that call a model from the site,** such as a tagline writer or a chatbot. Even the cheapest model costs money per use, and the budget is zero. Revisit only with a budget.
- **Third parties posting opportunities.** Only the owner posts, for now.

## Open risks

Tracked in detail in [ARCHITECTURE.md](./ARCHITECTURE.md#open-items-and-risks).

1. Not yet sanctioned by PCU
2. Email deliverability to PCU untested
3. Unknown whether PCU mailboxes cover every student and survive graduation
4. Only one person holds every account
5. Frontend has no owner, because the project owner is focusing on backend
