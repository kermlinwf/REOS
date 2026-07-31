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

## GitHub Pages (iPhone)

Live URL after deploy: **https://kermlinwf.github.io/REOS/**

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main` (or run the **Deploy to GitHub Pages** workflow)
3. On iPhone Safari open the URL → **Share → Add to Home Screen**

Solo/local mode stores data in that browser only (iPhone Safari ≠ your desktop). Back up with Tax export CSV if you care about the data.

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
