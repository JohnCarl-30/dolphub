# Glass navbar

## Report

Centered What, About, and Vision in the desktop navbar, split Log in and Sign up into separate pill controls, and applied a restrained translucent toolbar treatment.

## Change and reason

The header uses equal outer grid columns so its informational navigation remains centered even when the logo and account actions have different widths. The sticky material layer separates shared navigation from scrolling content while retaining the site’s monochrome visual system.

## Files touched

- Header, menu, global material styles, navigation browser tests, and design guidance.

## Files not touched

- Authentication behavior, account routes, project-star logic, data schema, and existing feature-branch commits.

## Verification

- Lint, typecheck, production build, and targeted desktop and phone Playwright navigation checks.
