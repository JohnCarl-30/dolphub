# Legal, security, and support pages

Date: 2026-10-18. Branch: `feat/legal-support-navigation`.

## What changed and why

Added public Privacy & Security, Terms & Conditions, and Support pages so students can understand Dolphub's data handling and rules, request help, and report security problems through a clear private channel. The copy follows the service's implemented authentication, profile, storage, moderation, and deletion behavior; it does not introduce new data collection.

Added an accessible responsive burger menu and footer links for the three pages. Desktop keeps Home and Profile visible beside the burger, while phone layouts move all navigation destinations into the menu. The menu exposes its state, closes on selection, outside interaction, or Escape, and restores trigger focus after Escape.

The privacy and terms text is a product-specific draft. The operator must confirm the controller identity, retention commitments, and legal wording before public launch. Support, privacy, and terms requests go directly to the two maintainers through their published GitHub email addresses.

## Files touched

- Added the three routes under `app/`, including canonical, social, and descriptive metadata.
- Added shared long-form page and interactive menu components under `components/`.
- Updated the shared header and footer, static sitemap, design source of truth, and Playwright page coverage.
- Preserved and incorporated the previously prepared production Home/Profile labels and footer wording. Its original `docs/navigation-footer-report.md` remains unchanged as the record of that work.

## Files not touched

Authentication behavior, server actions, APIs, database schema and migrations, service logic, storage and upload handling, dashboard fields, public student-profile data, global color and motion tokens, package manifests, and lockfiles were not changed.

## Test cases and readback

- `npm run lint`: passed.
- `npm run typecheck`: passed; Next.js route types generated successfully.
- `npm test`: 20 files and 179 tests passed.
- `E2E_PORT=3199 npm run test:e2e`: 78 tests passed across desktop and phone projects. The suite covers the burger at both breakpoints, menu dismissal and focus restoration, both maintainer mail links on every information page, and the private vulnerability-report destination.
- The Playwright run built the Next.js 16.4.2 production application before testing.
- Read back `/privacy`, `/terms`, `/support`, and `/sitemap.xml` from the production server: all returned 200, each page emitted its canonical metadata and expected content, and the sitemap listed all three routes.
- Visually inspected the complete Privacy & Security page at 1440px and the Support page with its open menu at 390px. Typography, borders, menu stacking, footer links, support actions, and long-form spacing matched the design guide without horizontal overflow.

## Compatibility and deployment

The change adds static public pages and client-side navigation behavior only. Existing URLs, bookmarks, backend interfaces, and stored data remain compatible. Complete owner/legal review of the policy drafts before deploying them publicly.
