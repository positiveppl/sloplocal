import { Link } from 'react-router-dom';

export default function Start() {
  return (
    <div className="narrow-wrap start-page">
      <Link to="/" className="back-link">← Back to the board</Link>
      <div className="section-kicker">New builder walkthrough</div>
      <h1 className="page-title">From Prompt to Product</h1>
      <p className="page-sub">
        Turn the thing your agent just made into a real SLOP LOCAL listing people can find, try, and vote on.
      </p>

      <section>
        <div className="start-step">1</div>
        <h2>Ship something people can open</h2>
        <p>
          Free to use, publicly reachable, and built with enough care that a stranger can understand what it does in a few seconds.
        </p>
      </section>

      <section>
        <div className="start-step">2</div>
        <h2>Write the market label</h2>
        <p>
          Give it a clear name, a working URL, one sharp tagline, the best category, and the tools you built it with.
        </p>
      </section>

      <section>
        <div className="start-step">3</div>
        <h2>Drop your slop</h2>
        <p>
          Submit it for review. Once approved, it hits the board with a screenshot, votes, and your builder profile attached.
        </p>
        <div className="start-actions">
          <Link to="/submit" className="btn btn-primary">Drop your slop ↗</Link>
          <Link to="/docs/agent" className="btn">Connect your agent →</Link>
        </div>
      </section>
    </div>
  );
}
