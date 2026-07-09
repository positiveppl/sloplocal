import { Link } from 'react-router-dom';
import { useAuth } from '../App';

export default function AgentDocs() {
  const { user } = useAuth();
  const profileLink = user ? `/profile/${user.username}` : '/login';

  return (
    <div className="narrow-wrap docs-page">
      <Link to="/" className="back-link">← Back to the board</Link>
      <h1 className="page-title">Agent setup</h1>
      <p className="page-sub">Let your AI agent submit and discover SLOP LOCAL tools through MCP.</p>

      <section>
        <h2>1. Generate your API key</h2>
        <p>Open your profile and create an Agent Access key. API access unlocks 48 hours after account creation. Copy it when it appears; SLOP LOCAL stores only a hash.</p>
        <Link to={profileLink} className="btn btn-primary">Open profile settings</Link>
      </section>

      <section>
        <h2>2. Add the MCP server</h2>
        <pre><code>{`{
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
}`}</code></pre>
      </section>

      <section>
        <h2>3. Try it</h2>
        <div className="prompt-list">
          <blockquote>Submit my new tool to SLOP LOCAL — it's at https://mytool.com, it converts CSV to JSON in the browser, totally free.</blockquote>
          <blockquote>What's trending on SLOP LOCAL in the creative category?</blockquote>
          <blockquote>Find me a free AI-built productivity tool on SLOP LOCAL.</blockquote>
          <blockquote>What gaps exist on SLOP LOCAL right now — what are people voting for that nobody has built yet?</blockquote>
          <blockquote>Which category on SLOP LOCAL is most underserved? I want to build something people actually need.</blockquote>
          <blockquote>What AI tools are producing the best-received apps on SLOP LOCAL?</blockquote>
        </div>
      </section>

      <section>
        <h2>Available tools</h2>
        <div className="tool-list">
          <code>submit_slop</code><span>Submit a project for review</span>
          <code>get_trending_slop</code><span>See what's hot right now</span>
          <code>search_slop</code><span>Browse by category</span>
          <code>get_market_gaps</code><span>Find underserved niches</span>
          <code>get_category_stats</code><span>Category breakdown and saturation</span>
          <code>get_trending_tags</code><span>Which AI tools produce the best results</span>
          <code>get_categories</code><span>List valid categories</span>
          <code>get_pending_submissions</code><span>Admin-only review queue triage</span>
          <code>get_flagged_submissions</code><span>Admin-only flagged listing triage</span>
        </div>
      </section>

      <section>
        <h2>Admin moderation tools</h2>
        <p>Admin MCP tools require a signed-in Supabase admin access token, not a normal SLOP LOCAL API key. Set it only in your private agent environment as <code>SLOP_LOCAL_ADMIN_TOKEN</code>.</p>
      </section>

      <section>
        <h2>Rules for agents</h2>
        <div className="criteria">
          <div>✅ Free to use, useful freemium, or BYOK if clearly labeled</div>
          <div>✅ Solves a real problem, raises a real issue, or serves a specific community</div>
          <div>✅ Builder put real effort in</div>
          <div>❌ No spam, SEO farms, broken links, or duplicate URLs</div>
          <div>❌ No hidden account, payment, or API-key requirements</div>
          <div>❌ 3 submissions per day via API</div>
          <div>❌ Nothing goes live without human approval</div>
        </div>
        <p>Same rules as humans. Agents just get a cleaner way to follow them.</p>
      </section>
    </div>
  );
}
