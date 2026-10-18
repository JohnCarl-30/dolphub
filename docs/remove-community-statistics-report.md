# Remove the homepage community statistics strip

Date: 2026-10-18. Branch: `feat/dolphub-svg-icons`.

## What changed and why

Removed the homepage strip that displayed the published-page count, course count, and mock status. The strip did not provide a useful action or decision at this stage and interrupted the transition from the student showcase to the publishing guidance.

The showcase's skip link still targets `#after-showcase`. That target, its programmatic focus behavior, and its accessible region name now belong to the "How a page gets published" section, so skipping the showcase continues directly into the next useful content.

## Files touched

- `app/home-page.tsx`: removed the statistics section, its unused published-profile calculation, and the private `Stat` component; moved the skip destination to the publishing section.
- `e2e/pages.spec.ts`: added coverage for the removed content and the retained skip-link focus behavior.
- `docs/remove-community-statistics-report.md`: recorded the change and verification.

## Files and behavior not changed

No changes were made to showcase cards, course filtering and counts, profile data, dashboard edits, particles, routes, persistence, dependencies, or project configuration. The historical horizontal-showcase report was left unchanged because it records the earlier implementation and its verification at that time.

## Verification

- Full Vitest suite passed: 179 tests across 20 files.
- ESLint passed.
- Next.js route type generation and TypeScript passed.
- The production build completed successfully as part of the isolated browser test run.
- The new desktop Playwright regression test passed against an isolated production server. It confirms the statistics region and its two count labels are absent, the skip link still points to `#after-showcase`, and activating it focuses the visible publishing-steps section.
- The refreshed local preview was read back at `http://localhost:3100/`: the statistics strip is absent and the publishing steps immediately follow the showcase.
- Git diff whitespace validation passed.
