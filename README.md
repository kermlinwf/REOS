# REOS

Real Estate Operations & Asset Management — a static SPA for GitHub Pages with Supabase (Auth, Postgres + RLS, Storage).

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- shadcn-style UI primitives
- `@supabase/supabase-js` (browser only)
- React Router (basename-aware for GitHub Pages subpaths)
- Recharts for portfolio cash activity

## Architecture

| Concern | Approach |
|--------|----------|
| Hosting | Static `dist/` → GitHub Pages |
| Auth / DB / files | Supabase client SDK |
| Security | Row Level Security (`owner_id = auth.uid()`) |
| Money | Integer **cents** (`bigint`) + `lib/finance.ts` for NOI / cash flow / cap rate |
| Mobile | Safe-area insets, 44px+ touch targets, bottom nav on iPhone |

No Node servers, no `app/api`, no SSR.

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Create a Supabase project. Paste URL + anon key into `.env.local`.

3. Run [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) in the SQL Editor.

4. Create private Storage buckets `receipts` and `leases`. Apply the storage policies commented at the bottom of the migration.

5. Enable Email auth in Supabase Auth settings.

6. Develop locally:

```bash
npm install
npm run dev
```

## GitHub Pages

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Add secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Push to `main` — workflow builds with `VITE_BASE_PATH=/<repo>/`.
4. In Supabase Auth, add your Pages URL to **Redirect URLs**.

For a custom domain, set `VITE_BASE_PATH=/` in the workflow.

SPA deep links: Vite emits `index.html` at the root; for project sites, enable “404 → index.html” via a `404.html` copy of `index.html` if needed:

```bash
# after build, for GitHub Pages client-side routing
cp dist/index.html dist/404.html
```

(The deploy workflow can be extended to do this automatically.)

## Domain model

- **Properties** → **Units** → **Leases** ↔ **Tenants**
- **Transactions** ledger (income/expense) with categories for rent, fees, deposits, OpEx, CapEx, mortgage/debt service
- Optional receipt / lease PDF paths in Storage (`{user_id}/{uuid}.ext`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local Vite server |
| `npm run build` | Typecheck + static export to `dist/` |
| `npm run preview` | Preview the static build |
