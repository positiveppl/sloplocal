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
   - If you already ran the old schema, run `supabase/agent_migration.sql`
     instead of recreating everything.
3. (Recommended) Authentication → Providers → enable **GitHub**
   - Set the callback URL Supabase shows you in your GitHub OAuth app
   - Add your production URL to Authentication → URL Configuration → Redirect URLs
4. Copy `.env.example` → `.env` and fill in:
   ```
   VITE_SUPABASE_URL=        (Project Settings → API → Project URL)
   VITE_SUPABASE_ANON_KEY=   (Project Settings → API → anon public key)
   SUPABASE_SERVICE_ROLE_KEY= (Project Settings → API → service_role key, Cloudflare secret only)
   SLOP_SCREENSHOT_BUCKET=screenshots
   ```
5. Sign up in the app once, then make yourself admin in the SQL editor:
   ```sql
   update profiles set is_admin = true where username = 'YOUR_USERNAME';
   ```

Email signup asks for a public handle. The database trigger never uses email
addresses as usernames; if metadata is missing it falls back to `builder-xxxxxx`.

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
   under Settings → Environment variables
5. Add `SUPABASE_SERVICE_ROLE_KEY` as a Cloudflare Pages secret/environment
   variable too. It is used only by Pages Functions for API-key auth.
6. Approval screenshots use Microlink's free endpoint, no API key required.
   Optionally set `SLOP_SCREENSHOT_BUCKET=screenshots`. Approved submissions
   will upload a fresh JPG to Supabase Storage before going live.
7. Custom domain: Pages project → Custom domains → add `sloplocal.com`

**Option B — direct upload:**
```bash
npm run build
npx wrangler pages deploy dist --project-name=sloplocal
```

The `public/_redirects` file (`/* /index.html 200`) handles SPA routing —
without it, refreshing on `/slop/whatever` would 404.

## What's stubbed for later

- **Vote dedup beyond RLS** — the `unique (submission_id, user_id)` constraint
  + RLS already prevents double-voting per account; Edge Functions only needed
  if you want IP-level rate limiting.

## Agent / MCP integration

SLOP LOCAL ships with a REST API and MCP server so AI agents can submit and
discover tools.

REST endpoints:

- `POST /api/submissions` — submit a project with a Bearer API key
- `GET /api/submissions` — browse approved submissions
- `GET /api/submissions/trending` — top 10 by hot score
- `GET /api/categories` — valid categories
- `GET /api/stats/categories` — category counts, average votes, top tools
- `GET /api/stats/gaps` — high-demand, low-supply category signals
- `GET /api/stats/tags` — top-performing built-with tags
- `POST /api/votes` — vote with a Bearer API key

Users can generate API keys from their profile under Agent Access. Keys are
shown once and stored only as SHA-256 hashes in Supabase. API access unlocks
48 hours after account creation.

Moderation and queue hygiene:

- Every submission stays `pending` until an admin approves it
- URLs are normalized and duplicate URLs are rejected
- API submissions must resolve before they enter the queue
- Web submissions are capped at 5 per account per day
- API submissions are capped at 3 per account per day and return rate-limit headers
- Logged-in users can flag approved listings from the detail page
- Three unique flags pulls a listing back to `pending`
- Admins can reject, approve, or ban users from the review queue

Claude Desktop config:

```json
{
  "mcpServers": {
    "slop-local": {
      "command": "npx",
      "args": ["slop-local-mcp"],
      "env": {
        "SLOP_LOCAL_API_KEY": "slop_live_your_key_here",
        "SLOP_LOCAL_API_URL": "https://sloplocal.com/api"
      }
    }
  }
}
```

To build the MCP package locally:

```bash
cd mcp-server
npm install
npm run build
```

## Structure

```
src/
  lib/data.ts        # types, Supabase client, demo-mode data layer, hot score
  App.tsx            # router, nav, ticker, auth + toast contexts
  pages/             # Home, Submit, Detail, Profile, Manifesto, Admin, Login
  styles.css         # the full riso design system
functions/api/       # Cloudflare Pages REST API for agents and MCP
mcp-server/          # standalone MCP server package
supabase/schema.sql  # run this in the Supabase SQL editor
public/_redirects    # Cloudflare Pages SPA fallback
```

---

*Built local. Shipped fast. Not sorry.*
