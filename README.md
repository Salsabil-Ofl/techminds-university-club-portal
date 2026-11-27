# TechMinds University Club Portal

A bilingual, responsive portal for the TechMinds student technology club at Borg El Arab Technological University. The integrated application combines a public club website with an authenticated administration dashboard, an Express API, and MySQL-backed content.

## What the portal includes

- Public pages for events, members, news, the gallery, FAQs, registration, and contact.
- Arabic and English interfaces with responsive layouts.
- A React and TypeScript administration dashboard for managing club content and registrations.
- Public REST endpoints and a typed tRPC API for the dashboard.
- MySQL persistence managed with Drizzle ORM and versioned SQL migrations.

## Technology

- **Public website:** HTML, CSS, and JavaScript.
- **Dashboard:** React, TypeScript, Vite, Tailwind CSS, and shared UI components.
- **Server:** Node.js, Express, and tRPC.
- **Database:** MySQL-compatible database, Drizzle ORM, and `mysql2`.
- **Tooling:** pnpm, TypeScript, Vitest, and esbuild.

## Getting started

### Prerequisites

Use Node.js 22 or later, pnpm 10.18.0 (the version pinned by this repository), and access to a MySQL-compatible database. Corepack can provide the pinned pnpm version.

### Install and configure

```bash
corepack enable
pnpm install --frozen-lockfile
```

Set the required database and platform-authentication values in your local environment or deployment secret manager. At minimum, the server reads `DATABASE_URL`, `MANUS_PROJECT_ID`, and `MANUS_JWT_SECRET`; platform API and OAuth integrations may require additional `MANUS_*` values. Never commit credentials or use a production database for local experiments.

Apply the checked-in migrations to the database selected by `DATABASE_URL`, then start the integrated development server:

```bash
pnpm db:migrate
pnpm dev
```

The server listens on port `3000` by default and honors `PORT` when supplied.

### Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the integrated development server. |
| `pnpm check` | Type-check the integrated application. |
| `pnpm check:frontend` | Type-check the frontend source and its required public-config/build files. |
| `pnpm check:backend` | Type-check the server, database schema, migrations tooling, scripts, and tests. |
| `pnpm test` | Run the server test suite with Vitest. |
| `pnpm build` | Build the Vite client and bundle the Express server. |
| `pnpm start` | Start the production server after a full build. |
| `pnpm build:static` | Build only the static/client output. |
| `pnpm build:backend` | Bundle only the Express server with esbuild. |
| `pnpm db:migrate` | Apply committed Drizzle migrations. |
| `pnpm db:push` | Generate and apply a schema migration; review generated SQL before using it on shared data. |

The `frontend` branch uses `pnpm check:frontend` and `pnpm build:static`. The `backend` branch uses `pnpm check:backend`, `pnpm test`, and `pnpm build:backend`. The integrated `main` branch remains the full-stack application and uses the full commands above.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `client/public/` | Public HTML pages, stylesheets, browser JavaScript, and static assets. |
| `client/src/` | React/TypeScript dashboard, page modules, hooks, and reusable UI components. |
| `server/` | Express and tRPC routes, authentication, public APIs, business logic, and platform integrations. |
| `drizzle/` | Database schema, migration SQL, migration journal, and relation metadata. |
| `shared/` | Types and constants used by both client and server. |
| `scripts/` | Backend maintenance and seed scripts. |
| `docs/TECHNICAL_QA.md` | Project technical discussion notes. |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Shared dependency and package-manager contract. |
| `vite.config.ts`, `tsconfig*.json`, `vitest.config.ts`, `drizzle.config.ts` | Frontend, TypeScript, test, and database tooling configuration. |
| `Dockerfile` | Full-stack production container build, used with the integrated application. |

## Branches

- **`main`** is the complete, integrated application and the source of truth for a full-stack deployment.
- **`frontend`** focuses on `client/` and `shared/`, with the Vite configuration and the small `server/_core/publicConfig.ts` module required to expose only approved browser-safe platform settings.
- **`backend`** focuses on `server/`, `drizzle/`, backend scripts, tests, and `shared/`; it excludes the client implementation.

The root `package.json`, `pnpm-lock.yaml`, workspace settings, and shared types intentionally remain in both focused branches. Keeping one pinned dependency graph avoids divergent installs and preserves the build tools used by each layer. The frontend and backend TypeScript configs extend the shared compiler settings while limiting checks to their respective source trees. The full-stack `Dockerfile` belongs to `main` because its production build requires both the client output and server bundle.

## Team

Only names and LinkedIn information supplied for this roster are listed. Missing LinkedIn profiles are shown as an em dash.

| Name | LinkedIn |
| --- | --- |
| سلمى محمد ابراهيم غريب | — |
| mariemmomen661-cmd | — |
| منة الله هاشم السيد محمد | [LinkedIn](https://www.linkedin.com/in/menna-hashem-8387123aa) |

## Security notes

Keep secrets in environment variables or the deployment platform's secret manager. Do not place private credentials, student IDs, or production data in source files, README content, or commits. Database migrations and writes affect the database addressed by `DATABASE_URL`; use a dedicated development database when experimenting.
