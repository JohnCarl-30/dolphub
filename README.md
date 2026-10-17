# PCU Community

A public portfolio page at `/u/<handle>` for every PCU tech student. See [docs/PLAN.md](docs/PLAN.md) for the plan and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the decisions.

## Stack

Next.js, TypeScript and Tailwind on Vercel. Neon Postgres through Drizzle ORM. Images in Cloudflare R2.

## Setup

1. Install packages.

   ```bash
   npm install
   ```

2. Copy the environment template and fill it in.

   ```bash
   cp .env.example .env.local
   ```

3. Create the tables, then add the course list and settings row.

   ```bash
   export DATABASE_URL="<your Neon connection string>"
   npm run db:migrate
   npm run db:seed
   ```

4. Sign in once with your PCU email, then make yourself an admin.

   ```bash
   npm run db:make-admin -- you@pcu.edu.ph
   ```

5. Start the app.

   ```bash
   npm run dev
   ```

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
