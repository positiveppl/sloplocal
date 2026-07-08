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
        <p>Open your profile and create an Agent Access key. Copy it when it appears; SLOP LOCAL stores only a hash.</p>
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
    </div>
  );
}
