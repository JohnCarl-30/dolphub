# Dolphub visual notes (ITSUA public pages)

Recorded 2026-10-17 from live pages at [itsua.com](https://itsua.com/), [itsua.com/work/](https://itsua.com/work/), and [itsua.com/about/](https://itsua.com/about/). Used for structure and tokens only. Dolphub copy, students, and images stay original.

## Method

- Desktop: browser viewport 1920×1080, then computed styles via DevTools.
- Phone: `390×844` device metrics, then reload `/work/`.
- Screenshot text was unreliable (glyphs rendered with extra marks). Color, type family, and sizes below come from computed styles, not from reading the screenshot.

## Confirmed

| Token | Value | Source |
|---|---|---|
| Page background | `rgb(255, 255, 255)` | `document.body` on `/work/` |
| Body text | `rgb(14, 16, 18)` | `document.body` color |
| Muted text / chrome | `rgb(96, 99, 106)` | filter labels and secondary copy |
| Live / status green | `rgb(4, 120, 87)` | “accepting new work” treatment |
| Soft paper | `rgb(245, 245, 243)` | card and panel fills |
| Hairline / ink border | same as body ink | card and chrome edges |
| Body size | `16px`, line `24px` | `document.body` |
| Body face | Space Grotesk (fallbacks: Inter, Helvetica, Arial) | `document.body` |
| Nav / index face | Berkeley Mono, then JetBrains Mono | header links |
| `/work` heading | `120px`, weight `500`, letter-spacing `-4.8px` | `h1` on desktop `/work/` |
| Header index | `[ 00 ] INDEX` style numbered links | `/work/`, `/about/` |
| Work cards | Number (`001`), title, one line, uppercase tags | `/work/` index |
| Filters | Category pills with counts; phone collapses to one “ALL” control | `/work/` desktop vs 390px |
| Process | Slash section (`/process`) and numbered steps | `/about/` |

## Inferred (not measured as pixels)

- Desktop work grid is three columns; phone is one stacked card.
- Large slash titles stay oversized on a phone, then the first card sits under a compact filter row.
- Accent blue (`rgb(47, 76, 255)`) and amber (`rgb(180, 83, 9)`) appear on the live site. They look like category chips, not the default text color. Dolphub does not need those chips.

## What Dolphub takes

- White page, near-black ink, muted gray, one green status color, paper-gray placeholders.
- Slash section labels (`/students`, `/publish`) and a numbered header index.
- Numbered profile cards: index, name, one line, uppercase course tag.
- Quiet stats row and a short numbered publish sequence.
- Space Grotesk for body and titles; keep a mono face for the index (Geist Mono, already in the app).

## What Dolphub does not take

- ITSUA agency copy, client names, testimonials, prices, logos, or project screenshots.
- Their exact 120px title size as a hard rule. Use a large slash heading that still fits a phone.
