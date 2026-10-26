# Dolphub design

This is the design source of truth for Dolphub. Use it when building or reviewing the public landing page at `/`, the signed-in showcase at `/home`, public profiles at `/u/<handle>`, dashboard, sign-in and verification screens, privacy, terms and support pages, shared chrome, and frontend tokens. It contains the visual foundation and Dolphub-specific adaptations in one place.

The audience is PCU students in IT, CS, and Computer Engineering. Keep the interface direct: discover students, inspect their projects, publish a portfolio, and share one public link.

## Visual foundation

Dolphub takes its white page, near-black ink, restrained borders, oversized typography, slash labels, numbered navigation, and numbered cards from a study of ITSUA's public home, work, and about pages recorded on 2026-10-17. These are structural references; Dolphub copy, students, branding, and imagery stay original.

The study used a 1920 × 1080 desktop viewport and a 390 × 844 phone viewport. Computed styles confirmed the neutral colors below, Space Grotesk body text at 16px with a 24px line height, a monospace navigation face, numbered links and cards, counted category filters, and numbered process steps. Screenshot text was unreliable, so font and color measurements came from computed styles.

The reference's three-column desktop grid and stacked phone cards were visual inferences, not measured layout requirements. Dolphub keeps its current horizontal student showcase and accessible list fallback. The reference's phone-only “ALL” filter control is also not a requirement: Dolphub keeps its wrapping course buttons and counts.

Other deliberate adaptations:

- Use Geist Mono for navigation and metadata, rather than the reference's Berkeley Mono / JetBrains Mono stack.
- Use responsive headings rather than fixing titles to the measured reference heading of 120px, weight 500, and -4.8px letter spacing.
- Exclude emerald green, including status indicators. Do not adopt the reference's green status treatment or blue and amber category accents.

## Color and typography

Reuse the tokens in [app/globals.css](app/globals.css). Do not introduce a second palette, zinc-based styling, or `dark:` variants on new or restyled screens.

| Role | Value | Tailwind usage |
| --- | --- | --- |
| Page background | `#ffffff` | `bg-background` |
| Ink / foreground | `#0e1012` | `text-ink`, `text-foreground`, `bg-ink` |
| Muted text / chrome | `#60636a` | `text-muted` |
| Soft paper / panels | `#f5f5f3` | `bg-paper` |
| Hairline | Ink at 10% opacity | `border-ink/10` |

- Use neutral text and icons for status, with an explicit label that communicates the state without color. Emerald green is not part of the palette.
- Use white and paper for surfaces, subtle ink borders for separation, and solid ink with white text for selected controls.
- Use Space Grotesk (`font-sans`) for body copy and headings. It is loaded in [app/layout.tsx](app/layout.tsx), with Arial, Helvetica, and sans-serif body fallbacks in CSS.
- Use Geist Mono (`font-mono`) for navigation indices, slash labels, filters, course tags, card indices, and secondary chrome.
- Start body copy at 16px with a 24px line height; allow more leading for introductory or longer copy. Keep secondary descriptions readable rather than compressing them into metadata.
- Use medium-weight, tightly tracked headings. The homepage uses `text-5xl sm:text-7xl`; public profile names use `text-5xl`. Headings must fit a phone without horizontal document overflow.
- Keep metadata compact, uppercase, and lightly tracked. Header and filter labels currently use 11px mono text.
- Profile pictures use square, sharp-cornered frames with `object-cover` and centered framing. They appear in the account menu, dashboard identity rail, and public profile, but never replace project covers on showcase cards.

## Layout and components

### Shared shell and page structure

- Use the header, main, and footer from [components/site-shell.tsx](components/site-shell.tsx).
- Use `max-w-6xl` for the homepage and shared chrome, `max-w-3xl` for public profile content, and `max-w-md` for dashboard and authentication forms. Use `px-4`, increasing to `sm:px-6` on public pages where appropriate.
- At `lg` (1024px) and wider, the three-column header keeps signed-in Home, Dashboard, and Profile centered between the logo and right-side controls. The hamburger menu on the right contains What, About, Vision, Privacy & Security, Terms, Support, and (when signed in) Log out. Signed-out visitors see separate rounded Log in and Sign up controls beside the hamburger; both open the passwordless PCU email flow.
- Below `lg`, the hamburger menu contains the public destinations and signed-in account links. Signed-in menus begin with the student's portrait and identity and end with Log out. Signed-out menus include Log in and Sign up only when those header controls are hidden. The menu closes on selection, outside interaction, or Escape; Escape returns focus to its trigger. Privacy & Security, Terms, and Support remain in the footer.
- The portrait is optional, with initials on paper as its fallback. Signed-in menus end with Log out.
- Header chrome uses a restrained white translucent material with backdrop blur, saturation, a light top edge, and a shallow shadow. Keep it sticky so content scrolls beneath it. Reduced-transparency and increased-contrast preferences use a solid white surface with a clear border.
- Preserve the compact mono footer and hairline shell borders. Use `Dolphub · Built for PCU tech students` and `© 2026 Dolphub contributors · MIT License` as the production footer copy, followed by Privacy & Security, Terms, and Support links.
- Use slash section labels such as `/students`, `/u/{handle}`, `/publish`, `/dashboard`, and `/login`.
- Keep the public landing page focused on compact links to What, About, and Vision, then up to three featured projects. Rank those projects by public star count, fill zero-star slots with recent projects, and show at most one project per student.
- Keep streamed-data failures local. A failed featured-project request replaces only that section with a neutral explanation and Retry control; a failed public profile shows its own page-sized fallback. Unexpected route failures retain the shared shell and offer Retry and Home without exposing server messages or error digests.
- Keep dashboard forms phone-first. Existing image uploads remain labeled slots until an image workflow is implemented.

### Informational pages

- Privacy, terms, and support use a shared `max-w-3xl` long-form layout with a slash label, one page heading, a concise introduction, a fixed last-updated line, and clearly named sections.
- Keep paragraphs readable with the standard body size and generous line height. Use bullets for requirements, rights, troubleshooting, and data categories.
- Use underlined ink links inside long-form copy. The maintainer email actions use the standard solid-ink button treatment.
- Legal and security copy must describe implemented behavior without promising perfect availability or security. Review policy drafts before a public launch.

### Student cards and filters

- Cards show a three-digit index starting at `001`, student name, short tagline, uppercase course metadata, an image slot, and the public-profile link. Showcase cards also preview the first project when available.
- Use a paper surface, subtle ink border, and white image slot. Strengthen the border on hover and keep a visible focus ring.
- Standard image slots use a 16:10 aspect ratio. Showcase slots use 16:5 with an 8rem maximum height to leave room for student and project details.
- Filter with counted course buttons, including `All`. Buttons wrap on narrow screens; selected buttons use solid ink and white text.
- Filters are toggle buttons in a labeled group with `aria-pressed`, rather than tabs with a tab-panel keyboard model.
- An empty result shows the dashed `000` “Be the first” card and a short explanation of how to publish.

### Horizontal showcase

Keep the current behavior in [components/student-showcase.tsx](components/student-showcase.tsx) and [components/animations/use-showcase-scroll.ts](components/animations/use-showcase-scroll.ts).

- Render a readable single-column list on the server and during initial hydration. Enhance to the horizontal layout after browser preferences and measurements are available.
- When content overflows and the viewport has enough height, pin the showcase frame at `100svh`. Normal vertical scrolling moves cards horizontally; added section height corresponds to the measured horizontal overflow.
- Size horizontal cards at `min(88vw, 22rem)` with a 1rem gap. Keep controls and card content visible without horizontal document overflow.
- Use position-based smoothstep easing, `p²(3−2p)`, for scroll traversal. Reversing or stopping scroll must not queue extra movement or inertial catch-up.
- Offer list and scroll views, remembering the choice for the session when storage is available. Retain the selected or focused card when changing views.
- Use the list for reduced motion, an explicit list preference, or insufficient viewport height. When cards fit horizontally, use natural flow without pinning or added scroll height. Phone width alone does not force list mode.
- Preserve course counts and filtering. Filtering keeps focus on its control; an empty result keeps the empty-state card.
- Tab and Shift+Tab reveal focused cards immediately. “Skip showcase” moves focus and scroll position directly to the following publishing section. Normal vertical scrolling continues after the final card.
- Show an ink progress bar during pinned traversal with an accessible progress value. Recalculate layout after viewport, content, or font changes.

## Motion and accessibility

Use the existing CSS utilities and motion tokens in [app/globals.css](app/globals.css), and preserve the current particle integration. Do not add another motion library.

| Motion | Rule |
| --- | --- |
| Entrance easing | `cubic-bezier(0.23, 1, 0.32, 1)` via `--ease-out` |
| On-screen movement easing | `cubic-bezier(0.77, 0, 0.175, 1)` via `--ease-in-out` |
| Color and border transitions | Plain `ease`, default duration 160ms |
| Press feedback | `press`: scale to 0.97 while active over 160ms |
| Content entrance | `rise`: fade and rise 16px over 400ms |
| Entrance stagger | `--i`: 50ms intervals, index capped at 8 |

- Use `press` for buttons, link-buttons, and interactive cards; use `rise` for newly arrived content such as filter results and saved notices. Use `transition-colors` for hover color changes.
- Keep control transitions under 300ms and avoid `ease-in`. Keyboard focus corrections, view anchoring, and skip navigation are immediate.
- With reduced motion, `rise` becomes a 200ms fade without staggering, press feedback uses opacity instead of scaling, and the showcase becomes an unpinned list without track transforms or a progress bar.
- Keep the particle network decorative and out of the accessibility tree. It follows page and showcase scrolling with bounded background displacement. Autonomous drift pauses during pinned traversal and while the document is hidden.
- The shared particle layer is `pointer-events: none` so cards and controls remain clickable. Keep tsParticles `detectsOn: "window"`: hover repulsion reads pointer movement from `window`, not canvas hit-testing, so repulsion remains active even though the canvas is click-through. The provider lives in the shared shell and persists across client-side route changes.
- Before JavaScript, on particle failure, and with reduced motion, retain the static dot fallback. Reduced motion disables the animated particle canvas and homepage background transforms. The background must not intercept clicks or cover content.
- Preserve visible ink focus treatment: the global 2px outline with a 2px offset, or the existing `focus-visible:ring-2 focus-visible:ring-ink` treatment on controls and cards.
- Active navigation uses `aria-current="page"` through [components/nav-link.tsx](components/nav-link.tsx). Form hints use `aria-describedby` and remain separate from labels.
- Keep every student profile reachable by keyboard in both showcase views, and communicate selected, empty, and status states with text or semantics as well as appearance.

## Copy, imagery, and change boundaries

- Speak directly to PCU tech students. Keep card descriptions short and give publishing steps clear actions.
- Each student has one public link at `/u/<handle>` for resumes and sharing.
- Use original Dolphub branding, student content, and imagery. Do not reuse ITSUA agency copy, client names, testimonials, prices, logos, or project screenshots.
- Design work must not change `lib/services/`, `lib/db/`, `lib/storage/`, or `drizzle/` unless that backend work is separately requested.
- Keep this document current when an intentional visual or interaction decision changes. Existing CSS and components implement these rules; historical reports record earlier changes and do not override this guide.
