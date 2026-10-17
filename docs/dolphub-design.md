---
name: dolphub-design
description: Applies Dolphub visual rules from the reverse-engineered layout. Use when building or reviewing /, /u/[handle], /dashboard, /login, /auth/verify, Tailwind tokens, cards, filters, or the header and footer.
---

# dolphub-design

Shared frontend rules for Evert and JC. Tokens live in [app/globals.css](../app/globals.css). Confirmed vs inferred measurements are in [reverse-engineering/dolphub-visual-notes.md](./reverse-engineering/dolphub-visual-notes.md). This file is the rule set; that note is the investigation.

Structure comes from ITSUA’s public pages. Copy, students, and images stay original Dolphub.

## When to use

Any new or restyled screen: home grid, public profile, dashboard, login, verify, shared chrome.

## Tokens

Do not invent a second palette.

| Token | Hex | Tailwind |
|---|---|---|
| background | `#ffffff` | `bg-background` |
| ink / foreground | `#0e1012` | `text-ink`, `text-foreground` |
| muted | `#60636a` | `text-muted` |
| paper | `#f5f5f3` | `bg-paper` |
| hairline | ink at 10% | `border-ink/10` |

- Sans: Space Grotesk (`font-sans`) for body and titles.
- Mono: Geist Mono (`font-mono`) for index, filters, slash labels, and chrome.
- Focus: `focus-visible:ring-2 focus-visible:ring-ink`.
- Header links carry `aria-current="page"` through `components/nav-link.tsx`.
- Form hints go in `aria-describedby`, never inside the label.
- No `dark:` and no zinc palette on new or restyled screens.

## Motion

Tokens live in `app/globals.css` under `@theme`. Do not add a motion library; CSS runs off the main thread while the particle chunk loads.

- Easing: `ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)` for anything entering; `ease-in-out` is `cubic-bezier(0.77, 0, 0.175, 1)` for movement on screen; plain `ease` for color and border changes. Never `ease-in`.
- Press: put `press` on every button, link-button and card. It scales to 0.97 over 160ms while held and snaps back on release.
- Entrance: put `rise` on content that just arrived (a new filter result, a saved notice, a new project row). It rises 16px over 400ms; stagger siblings with `--i` (50ms apart, cap at 8).
- Hover and color changes use `transition-colors` with the 160ms default.
- Reduced motion keeps the fade and the color change and drops every transform. Both utilities already do this.
- Durations stay under 300ms for controls. Nothing animates on a keyboard shortcut.

## Layout

- Shell: header + main + footer from `components/site-shell.tsx`.
- Content width: `max-w-6xl` on public pages. `max-w-md` on dashboard and auth forms.
- Slash section labels: `/students`, `/u/{handle}`, `/publish`, `/dashboard`, `/login`.
- Numbered header index: `[ 00 ] Students`, `[ 01 ] Dashboard`.
- Home grid: 3 columns on desktop, 1 on phone.
- Profile cards: `001` index, display name, one-line tagline, uppercase course tag, image slot placeholder.
- Empty filter: dashed “Be the first” card.
- Under the grid: quiet stats row, then a numbered publish sequence.
- Dashboard is phone-first. Image upload is a labeled slot only.

Headings are large and phone-safe (`text-5xl` / `sm:text-7xl`). Do not lock to ITSUA’s 120px `/work` size.

## Copy

- Voice: PCU tech students (IT, CS, Computer Engineering).
- One public link per student: `/u/<handle>`.
- Do not reuse ITSUA client names, testimonials, prices, logos, or screenshots.

## Do not change

- `lib/services/`, `lib/db/`, `lib/storage/`, `drizzle/`
