# PCU Community: Overall Plan

Last updated: 2026-10-17. The decisions behind this plan are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Goal

Give every PCU tech student a public portfolio page at `/u/<handle>` that shows their projects, so classmates, orgs and recruiters can find them.

**Success:** 50 of about 200 tech students have a profile with at least one project by the end of the first semester, mid-December 2026.

## Milestones

| Date | Milestone | Done when |
|---|---|---|
| Sat 2026-10-17 | Accounts and scaffold | App deploys to Vercel, test email reaches a PCU inbox |
| Sat 2026-10-24 | Soft launch | About 10 invited tech classmates can sign in and publish a page |
| Sat 2026-11-07 | Public launch | Launch gate below is fully checked |
| Sat 2026-11-28 | Midpoint check | At least 15 profiles with a project, or the plan changes |
| Mid-December 2026 | Semester target | 50 profiles with a project |

## Ownership

The project owner focuses on **backend, not frontend**.

| Area | Owner | Covers |
|---|---|---|
| Backend | Project owner | Database, sign-in, upload pipeline, server actions and API routes, page revalidation, preview tag data, admin and moderation logic |
| Frontend | **Unassigned** | Dashboard screens, public page and grid layout, browser image compression, phone testing |

Until a frontend owner exists, frontend tasks use a ready-made component kit and plain screens. Finding a frontend collaborator is a Phase 1 task.

## Phase 1: Build week (Oct 17 to Oct 23)

One task per day, sized for evenings during classes.

| Day | Task | Area |
|---|---|---|
| Sat Oct 17 | Send a Resend test email to a PCU address and check inbox vs spam. Create Vercel, Neon, R2 and Resend accounts. Scaffold Next.js with TypeScript and Tailwind, and deploy it. Ask around for a frontend collaborator | Backend |
| Sun Oct 18 | Database schema for users, courses, profiles, projects and images. Seed the tech course list and the reserved handle blocklist | Backend |
| Mon Oct 19 | Magic-link sign-in through Resend, limited to the PCU email domain. Stop non-tech students at the course step | Backend |
| Tue Oct 20 | Dashboard, phone-first: pick a handle, then edit name, tagline, course and Messenger link | Frontend, with backend server actions |
| Wed Oct 21 | Projects with demo and source links. Image upload: browser compression, then server checks, sharp re-encode and R2 storage. Enforce 10 images and 500 KB | Backend, plus frontend for the form and browser compression |
| Thu Oct 22 | Public page `/u/[handle]` with ISR and link preview tags. Home grid of profiles with at least one project | Backend for data and revalidation, frontend for layout |
| Fri Oct 23 | Admin page with profile count, hide profile and freeze signups. "Report this page" link. Test on a budget Android phone on campus wifi | Backend, plus frontend for the admin screen and phone test |
| Sat Oct 24 | **Soft launch** to about 10 classmates, invited by name | Both |

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
- **Midpoint on Nov 28.** Below 15 profiles means changing the approach, such as running a page-building session with a tech org, instead of adding features.
- **Semester end.** Compare against the target of 50, then write a short retrospective in this folder.

## Backlog after launch

Built in this order once the public launch is stable:

1. Course search on the home grid
2. Report button that auto-hides a page after 3 distinct reporters and notifies the owner
3. Self-serve account deletion that removes the row, R2 images and cached page
4. Tech internship posts: company, role, deadline and link, expiring after the deadline
5. Recovery email, needed before the first graduating class

## Open risks

Tracked in detail in [ARCHITECTURE.md](./ARCHITECTURE.md#open-items-and-risks).

1. Not yet sanctioned by PCU
2. Email deliverability to PCU untested
3. Unknown whether PCU mailboxes cover every student and survive graduation
4. Only one person holds every account
5. Frontend has no owner, because the project owner is focusing on backend
