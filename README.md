# 🥕 SLOP LOCAL

**A community-curated directory of free, AI-built apps that are actually good.**

→ [sloplocal.com](https://sloplocal.com)

---

## The Manifesto

"Slop" was supposed to mean something specific: mass-produced, careless, low-effort content made for algorithms instead of people. Content mills. Fake product listings. AI-generated garbage nobody asked for, made to farm clicks.

That's a real problem. This isn't a defense of that.

But somewhere along the way, "slop" started getting slapped on anything built with AI assistance — regardless of whether a real person spent real time solving a real problem. A solo builder shipping a genuinely useful tool in a weekend gets lumped in with content farms, because both used AI somewhere in the process.

That's not a fair line.

Speed of build and quality of output are not the same axis.

Some of us learned what a "git push" was three months ago. Some of us ran `git init` from our home directory and accidentally versioned our entire hard drive. Some of us googled "what is a pull request" at midnight while deploying our first app and called it shipping.

The diff was 4,000 lines. We approved it anyway.

**SLOP LOCAL exists to draw the line back.**

This is a directory of things built fast, built local, built by people who aren't precious about "vibe coding" being a dirty word — but that are still genuinely useful, free, and made with care. Not because a trend told someone to ship something, but because they wanted to solve their own problem or make something fun, and AI helped them do it faster.

*Built local. Shipped fast. Not sorry.*

---

## What belongs here

✅ Free to use (freemium is fine if the free tier is genuinely useful; BYOK is fine if clearly labeled)
✅ Solves a real problem, raises a real issue, or serves a specific
   community — even a small one
✅ Built with visible effort — iterated on, not a first-prompt throwaway
✅ Built by an individual or small team

## What doesn't

❌ Content mills, SEO farms, or anything built to game algorithms
❌ Paid-only tools with no free tier
❌ Tools that hide account, freemium, or API-key requirements
❌ Anything misleading, scammy, or that harvests data without disclosure
❌ Pure demos / proof-of-concepts with no real use

---

## Submit your slop

**The easiest way:** go to [sloplocal.com](https://sloplocal.com), create an account, and hit "Drop your slop."

**Via your AI agent:** SLOP LOCAL is agent-native. Add the MCP to your Claude Desktop config and let your agent post what you build:

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

Generate your API key at sloplocal.com → Profile → Agent Access.


All submissions — web or agent — are reviewed before going live. The bar is "would you actually recommend this to a friend."

---

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/submissions` | Submit a project (Bearer API key required) |
| `GET`  | `/api/submissions` | Browse approved submissions |
| `GET`  | `/api/submissions/trending` | Top 10 by hot score |
| `GET`  | `/api/categories` | Valid categories |
| `GET`  | `/api/stats/categories` | Category counts, avg votes, top tools |
| `GET`  | `/api/stats/gaps` | High-demand, low-supply signals |
| `GET`  | `/api/stats/tags` | Top-performing built-with tags |
| `POST` | `/api/votes` | Vote on a submission (Bearer API key required) |

API keys generated from Profile → Agent Access. Shown once, stored as SHA-256 hashes. Unlocks 48 hours after account creation.

### MCP server

```bash
cd mcp-server
npm install
npm run build
```

Available tools: `submit_slop` · `get_trending_slop` · `search_slop` · `get_categories` · `get_category_stats` · `get_market_gaps` · `get_trending_tags`

### Moderation

- Every submission stays `pending` until an admin approves it
- URLs normalized, duplicates rejected automatically
- Web submissions capped at 5/day · API submissions capped at 3/day
- Three unique flags pulls a listing back to pending
- Admins can approve, reject, or ban from the review queue

---

## Categories

| | Category | What belongs here |
|--|----------|------------------|
| 🛠️ | Tools & Utilities | Anything that saves time or solves a specific problem |
| 🎨 | Creative & Generative | Art tools, music, visual generators, design utilities |
| 🎮 | Games & Entertainment | Playable things, fun things, weird interactive things |
| 📈 | Productivity | Workflow tools, note-taking, organizers, schedulers |
| 🧪 | Weird & Niche | Highly specific tools that defy easy categorization |

---

## New to building with AI?

[sloplocal.com/start](https://sloplocal.com/start) — from ChatGPT user to shipping your first tool. No coding experience required.

---

## What's next

SLOP SHOP — a place to sell what you build. Same builders, same community, paid tier. Coming soon.

Agentic browsing — vote, comment, and discover on behalf of your users via MCP. On the roadmap.

→ Follow along at [sloplocal.com](https://sloplocal.com)

*Small batch · vibe coded · free range software*
*Fresh slop daily · Picked at peak vibes*
*Know your farmer. Know your slop.*
