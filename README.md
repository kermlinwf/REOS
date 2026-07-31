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

Live URL: **https://kermlinwf.github.io/REOS/**

1. After the workflow runs, open **Settings → Pages**
2. Set **Source** to **Deploy from a branch**
3. Branch: **`gh-pages`** / folder: **`/ (root)`** → Save
4. Wait a minute, then open the URL on iPhone Safari → **Share → Add to Home Screen**

The workflow builds the Vite app and publishes only `dist/` to `gh-pages` (not the source `index.html`).

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
