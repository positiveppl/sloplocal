import { Link } from 'react-router-dom';

export default function Manifesto() {
  return (
    <div className="manifesto-wrap">
      <h1>It's not a filet.<br />But it'll feed you.</h1>
      <hr className="manifesto-rule" />
      <p>"Slop" was supposed to mean something specific: mass-produced, careless, low-effort content made for algorithms instead of people. Content mills. Fake product listings. AI-generated garbage nobody asked for, made to farm clicks.</p>
      <p>That's a real problem. This isn't a defense of that.</p>
      <p>But somewhere along the way, "slop" started getting slapped on anything built with AI assistance — regardless of whether a real person spent real time solving a real problem. A solo builder shipping a genuinely useful tool in a weekend gets lumped in with content farms, because both used AI somewhere in the process. That's not a fair line. <strong>Speed of build and quality of output are not the same axis.</strong></p>
      <p><strong>Slop Local exists to draw that line back.</strong></p>
      <p>This is a collective — a board where anyone can drop what they built, and everyone votes on what's good. Things built fast, built local, built by people who aren't precious about "vibe coding" being a dirty word, but who still made something genuinely useful, free, and made with care. Not because a trend told them to ship, but because they wanted to solve their own problem or make something fun, and AI helped them do it faster.</p>
      <p>Some of us learned what a "git push" was three months ago. Some of us ran <code>git init</code> from our home directory and accidentally versioned 657 gigabytes of our entire life. Some of us googled "what is a pull request" at midnight while deploying our first app and called it shipping.</p>
      <p><strong>We shipped anyway.</strong></p>
      <p>If it's free, if it works, and if a real person put in real effort — it belongs here, "slop" or not. It might not be a filet. But it'll feed you, and it'll give you the energy to keep going.</p>
      <p><strong>Built fast. Built local. Not sorry.</strong></p>
      <div className="manifesto-cta">
        <Link to="/submit" className="btn btn-primary">Submit your slop →</Link>
      </div>
    </div>
  );
}
