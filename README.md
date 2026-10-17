# PCU Community

A public portfolio page at `/u/<handle>` for every PCU tech student. See [docs/PLAN.md](docs/PLAN.md) for the plan and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the decisions.

## Stack

Next.js, TypeScript and Tailwind on Vercel. Neon Postgres through Drizzle ORM. Images in Cloudflare R2.

## Run locally, no accounts needed

```bash
npm install
cp .env.example .env.local
```

In `.env.local`, keep `DATABASE_URL=pglite:./.data/pglite`, set `APP_URL=http://localhost:3000`, and leave `RESEND_API_KEY` and the R2 values empty. Then:

```bash
npm run dev
```

Open http://localhost:3000/login and enter a PCU address. The sign-in link prints in the terminal. The local database lives in `.data/` and is created on first start.

## Production setup

1. **Resend.** Add `dolphub.tech` as a domain in Resend and create the DNS records it lists at your domain registrar. Wait until Resend shows the domain as verified, then create an API key.
2. **Neon.** Create a project and copy its connection string.
3. **Cloudflare R2.** Create a bucket with public access or a custom domain, and an API token for it.
4. **Vercel.** Set these environment variables for Production:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon connection string |
   | `APP_URL` | `https://dolphub.tech` |
   | `PCU_EMAIL_DOMAINS` | `pcu.edu.ph` |
   | `RESEND_API_KEY` | From Resend |
   | `RATE_LIMIT_SECRET` | 32 or more random characters, such as the output of `openssl rand -hex 32` |
   | `EMAIL_FROM` | `PCU Community <login@dolphub.tech>` |
   | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | From Cloudflare |

5. **Database.** From your computer, create the tables and seed data:

   ```bash
   export DATABASE_URL="<your Neon connection string>"
   npm run db:migrate
   npm run db:seed
   ```

6. **Admin.** Sign in once on the live site, then run `npm run db:make-admin -- you@pcu.edu.ph`.

The app refuses to start in production if Resend, R2, Neon or an https `APP_URL` is missing.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Starts the dev server |
| `npm test` | Runs backend tests against an in-memory Postgres. No accounts needed |
| `npm run typecheck` | Generates Next.js route types, then type-checks |
| `npm run lint` | Runs ESLint |
| `npm run db:generate` | Writes a migration after a schema change |
| `npm run db:migrate` | Applies migrations to `DATABASE_URL` |
| `npm run db:seed` | Adds the tech course list and settings row. Safe to rerun |
| `npm run db:make-admin -- <email>` | Gives an existing user admin rights |

## CI

GitHub Actions runs on every pull request and every push to `main`: lint, typecheck, a check that migrations match the schema, tests, and a production build. It needs no secrets, because tests use an in-memory database. The workflow is in `.github/workflows/ci.yml`.

## Layout

```
lib/db/        schema, Neon connection, seed scripts
lib/services/  business rules, one file per area, with tests
lib/storage/   R2 and in-memory image storage
lib/server.ts  production wiring. Server code only
drizzle/       generated SQL migrations
app/           pages and routes
```

Backend services are documented in [docs/BACKEND.md](docs/BACKEND.md).

## Security

Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md). Never open a public issue for one.

## License

[MIT](LICENSE)
