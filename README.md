# 🥕 SLOP LOCAL — the app

A community-curated board of free, AI-built apps that are actually good.
Vite + React + TypeScript SPA, Supabase backend, deploys to Cloudflare Pages.

**Demo mode:** if no Supabase env vars are set, the app runs entirely on seeded
in-memory data (sign-in gives you a demo admin account so you can try every
flow, including the review queue). This means you can deploy it *right now*
and wire up Supabase after.

---

## Local dev

```bash
npm install
npm run dev
```

Runs in demo mode until you add a `.env` (see below).

## Going live with Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → paste and run `supabase/schema.sql`
3. (Recommended) Authentication → Providers → enable **GitHub**
   - Set the callback URL Supabase shows you in your GitHub OAuth app
   - Add your production URL to Authentication → URL Configuration → Redirect URLs
4. Copy `.env.example` → `.env` and fill in:
   ```
   VITE_SUPABASE_URL=        (Project Settings → API → Project URL)
   VITE_SUPABASE_ANON_KEY=   (Project Settings → API → anon public key)
   ```
5. Sign up in the app once, then make yourself admin in the SQL editor:
   ```sql
   update profiles set is_admin = true where username = 'YOUR_USERNAME';
   ```

The schema includes fixes over the original spec: an `is_admin` flag on
profiles, RLS policies that let admins read the pending queue and
approve/reject (the original policies would have blocked both), submitters
can see their own pending submissions, and profiles are auto-created on
signup via trigger.

## Deploying to Cloudflare Pages

**Option A — Git integration (recommended):**
1. Push this repo to GitHub
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
   under Settings → Environment variables, then retry the deploy
5. Custom domain: Pages project → Custom domains → add `sloplocal.com`

**Option B — direct upload:**
```bash
npm run build
npx wrangler pages deploy dist --project-name=sloplocal
```

The `public/_redirects` file (`/* /index.html 200`) handles SPA routing —
without it, refreshing on `/slop/whatever` would 404.

## What's stubbed for later

- **Screenshot auto-capture** (Screenshotone) — needs a server-side call so the
  API key isn't exposed. Cleanest path on Cloudflare: a tiny Pages Function
  (`/functions/api/screenshot.ts`) called at approval time, writing the image
  to Supabase Storage.
- **Vote dedup beyond RLS** — the `unique (submission_id, user_id)` constraint
  + RLS already prevents double-voting per account; Edge Functions only needed
  if you want IP-level rate limiting.

## Structure

```
src/
  lib/data.ts        # types, Supabase client, demo-mode data layer, hot score
  App.tsx            # router, nav, ticker, auth + toast contexts
  pages/             # Home, Submit, Detail, Profile, Manifesto, Admin, Login
  styles.css         # the full riso design system
supabase/schema.sql  # run this in the Supabase SQL editor
public/_redirects    # Cloudflare Pages SPA fallback
```

---

*Built local. Shipped fast. Not sorry.*
