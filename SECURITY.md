# Security Policy

Dolphub holds student names, email addresses and project pages, so we take reports seriously.

## Reporting a vulnerability

**Do not open a public issue.** Report privately through GitHub instead:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Describe the problem, the steps to reproduce it, and what an attacker could do with it.

You will hear back within 3 days. We aim to fix serious issues within 14 days, and will tell you when the fix is live. With your permission, we will credit you in the fix.

## Scope

In scope:

- This repository's code.
- The live site at https://dolphub.tech.

Out of scope:

- Denial of service, or load testing the live site.
- Sending sign-in emails to addresses that are not yours. Test sign-in only with your own address, or run the app locally, where emails print to the terminal.
- Social engineering of students, staff or maintainers.
- Problems in third-party services we use, such as Vercel, Neon, Cloudflare or Resend. Report those to the service.
- Reports from automated scanners with no demonstrated impact.

## Testing safely

Run the app locally to test. It needs no accounts: see "Run locally" in the README. Never access, change or delete another student's data on the live site. If you reach someone else's data by accident, stop, and include that in your report.

We will not pursue action against anyone who reports in good faith and follows this policy.

## Supported versions

Only the current `main` branch, which is what https://dolphub.tech runs, receives security fixes.
