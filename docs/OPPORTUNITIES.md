# Opportunities: Plan

Last updated: 2026-10-17. Ships with the public launch on 2026-11-07.

## Goal

Give PCU tech students one place to find open internships, events, competitions and programs, each linking to where they apply or register.

## Decisions

| Question | Decision |
|---|---|
| Who posts | Admins only, from the admin page. Later also from the admin MCP server |
| Kinds | Internships and OJT, campus and tech events, competitions and hackathons, scholarships and programs |
| Student action | Open the link only. Dolphub stores nothing about which student looked at or applied to what |
| Timing | Built between the soft launch (Oct 24) and the public launch (Nov 7) |
| Expiry | A post disappears from the list once it closes. No manual cleanup |

## What a post contains

| Field | Rules |
|---|---|
| Kind | `internship`, `event`, `competition` or `program` |
| Title | The role or event name. Up to 120 characters |
| Organization | Company, org or office running it. Up to 80 characters |
| Summary | What it is and who it's for. Up to 500 characters |
| Link | Where to apply or register. Must start with `https://` |
| Where | On-site, online or hybrid, plus an optional place such as "PCU Manila, Room 402" |
| Deadline | Last day to apply or register |
| Starts and ends | Date and time of an event or competition |

Each kind needs a date, so every post can expire:

- **Internships and programs** need a deadline.
- **Events** need a start time.
- **Competitions** need a deadline or a start time.

**Closing time** is the deadline if there is one, otherwise the end time, otherwise the end of the start day, so an event with only a start time stays listed through that day. Dates are Philippine time. A date without a time means the end of that day, 11:59 pm.

## Pages

| Route | Shows | Owner |
|---|---|---|
| `/opportunities` | Open posts, soonest closing first, with filter tabs for each kind and a "Closes in 3 days" badge | Frontend |
| `/opportunities/<slug>` | One post with its details and a big "Apply" or "Register" button. The details are public and shareable in Messenger with their own link preview. The button needs sign-in: signed-out visitors get "Sign in to apply", and sign-in returns them to the post | Frontend |
| Home page | An "Upcoming" strip with the next three posts and a link to the full list | Frontend |
| Admin page | Create, edit, hide and delete posts, including closed ones | Frontend, with backend actions |

Slugs look like `accenture-software-intern-k3f9`: the title plus a short random ending, so two posts with the same title never collide.

Each post page carries a "Report a problem with this post" email link, for broken links and scams.

## Search and sharing

- **Indexed:** the list page and every open post. Both go in the sitemap.
- **Structured data, so Google can show posts as rich results:** internships and programs use `JobPosting` with `employmentType` `INTERN`. Events and competitions use `Event`.
- **Closed posts:** they get `noindex` and leave the sitemap. Their page stays reachable and says "This opportunity has closed", so old shared links still work.
- **Link preview:** each post gets a generated 1200x630 card with kind, title, organization and closing date. It uses the same design as student cards.

## Backend work (JohnCarl-30)

**Status, Oct 17:** steps 1 to 5 are done and tested. The frontend can build against them now. The contract is in [BACKEND.md](./BACKEND.md#opportunities).

1. **Schema.** An `opportunities` table with the fields above, plus `slug`, `is_hidden`, `created_by`, `created_at` and `updated_at`, and a migration.
2. **Services** in `lib/services/opportunities.ts`:
   - `createOpportunity`, `updateOpportunity`, `hideOpportunity` and `deleteOpportunity`. Admin only, with validation per kind, and every write recorded in `admin_audit_log`.
   - `listOpenOpportunities({ kind, limit })` and `getOpportunity(slug)`. Public, and closed posts are excluded from the list.
   - `listOpportunitiesForAdmin()`, which includes closed and hidden posts.
3. **Loaders and actions** for the frontend:
   - Public loaders cached under an `opportunities` tag that expires hourly, so closed posts drop off without a deploy.
   - Admin actions that refresh that tag on every write.
   - All of them listed in `docs/BACKEND.md` before the frontend starts.
4. **SEO.** Metadata, structured data, the preview image and sitemap entries, reusing `lib/seo.ts`.
5. **Tests.** Validation per kind, closing-time rules across Philippine and UTC time, open and closed listing, admin-only access, and the audit log.
6. **Later.** Add `post_opportunity` and `remove_opportunity` to the admin MCP server planned for Nov 21.

## Frontend work (fnzh-i)

**Status, Oct 21:** steps 1 to 4 are done, with browser tests in `e2e/opportunities.spec.ts`, `e2e/admin.spec.ts` and `e2e/home-content.spec.ts`. The sitemap now lists the pages. The home strip and focus band show real open posts and link to the full list. Admins post, edit, hide and delete posts at `/admin/opportunities`.

1. The `/opportunities` list with kind tabs, cards, closing badges and an empty state such as "No open internships right now".
2. The `/opportunities/<slug>` detail page, including the closed state.
3. The "Upcoming" strip on the home page.
4. The admin form, with dates entered as Philippine time and a preview of how the post will look.
5. Phone testing of all of the above.

## Content is the real risk

An empty opportunities page at launch is worse than none. The code is a few days of work. Filling it is ongoing.

- **Before launch:** at least 10 open posts, covering at least 3 kinds.
- **Sources:** the PCU career or placement office, org pages, company career pages, and tech community event pages.
- **Vetting before posting:**
  - The organization is real.
  - The link is official.
  - Nobody is asked to pay to apply.
  - The deadline is correct.
- **Owner:** one named person checks for new posts twice a week. Decide who before Oct 26.
- **Permission:** for events from orgs or offices, ask before reposting where possible, and link to their page rather than copying it.

## Schedule

| Dates | Backend | Frontend |
|---|---|---|
| Oct 18 to 24 | Build week and soft launch, unchanged | Build week and soft launch, unchanged |
| Sun Oct 25 | Write the types, loaders and actions with stubs, and document them | Review the contract |
| Oct 26 to 28 | Schema, services, tests, SEO | List and detail pages against the stubs |
| Oct 29 to 31 | Admin actions, preview image, sitemap | Home strip and admin form, then wiring |
| Nov 1 to 3 | Seed the first 10 or more real posts | Phone testing and fixes |
| Nov 4 to 6 | Buffer | Buffer |

New public launch gate item: at least 10 open posts across at least 3 kinds, every link checked.

## Not doing at launch

- **Student or org submissions.** Admins only, until there is time to review a queue.
- **Saved posts, reminders or RSVP.** These would store student data and use the Resend daily email limit.
- **Filtering by course.** Every post is shown to every tech student. Add per-course targeting only if the list gets long.
