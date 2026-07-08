import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { BUILT_WITH_OPTIONS, CATS, CategorySlug, submitSlop } from '../lib/data';

export default function Submit() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [cat, setCat] = useState<'' | CategorySlug>('');
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function toggleTag(t: string) {
    setTags(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }

  async function handleSubmit() {
    setError('');
    if (!user) { toast('Sign in first, then drop it.'); navigate('/login'); return; }
    if (!name.trim() || !url.trim() || !tagline.trim() || !cat) {
      setError('Name, URL, one-liner, and category are required.');
      return;
    }
    try { new URL(url); } catch { setError('That URL doesn\'t parse. Include the https://.'); return; }
    setBusy(true);
    const res = await submitSlop({
      name: name.trim(), url: url.trim(), tagline: tagline.trim(),
      description: description.trim(), category_slug: cat, built_with: [...tags], submitter: user,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Something broke. Try again.'); return; }
    toast('Dropped. It\'s in the review queue — live once a human approves it.');
    navigate('/');
  }

  return (
    <div className="narrow-wrap">
      <Link to="/" className="back-link">← Back to the board</Link>
      <h1 className="page-title">Drop your slop</h1>
      <p className="page-sub">Free, useful, made by you. That's the whole bar.</p>

      <div className="criteria">
        <div>✅ Free to use (a genuinely useful free tier counts)</div>
        <div>✅ Solves a real problem or is genuinely fun</div>
        <div>✅ Built with visible effort — iterated, not a first-prompt throwaway</div>
        <div>✅ Indie / small-team energy</div>
        <div>❌ No demos with no real use, content farms, SEO bait, or scams</div>
        <div>❌ No paid-only tools</div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>Project name <span className="req">*</span></label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="CHOPPL" />
      </div>
      <div className="field">
        <label>URL <span className="req">*</span></label>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" type="url" />
      </div>
      <div className="field">
        <label>One-liner <span className="req">*</span></label>
        <input value={tagline} maxLength={120} onChange={e => setTagline(e.target.value)} placeholder="What it does, in one breath" />
        <div className="hint">{120 - tagline.length} left</div>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={description} maxLength={500} rows={4} onChange={e => setDescription(e.target.value)} placeholder="What it does, why you built it, what makes it good. (optional, 500 max)" />
        <div className="hint">{500 - description.length} left</div>
      </div>
      <div className="field">
        <label>Category <span className="req">*</span></label>
        <select value={cat} onChange={e => setCat(e.target.value as CategorySlug)}>
          <option value="">Pick one</option>
          {(Object.keys(CATS) as CategorySlug[]).map(k => (
            <option key={k} value={k}>{CATS[k].full}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Built with</label>
        <div className="tag-picker">
          {BUILT_WITH_OPTIONS.map(t => (
            <button key={t} className={`tag-pick ${tags.has(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Screenshot</label>
        <input disabled placeholder="Auto-captured from your URL on approval" />
        <div className="hint">Screenshot capture happens at review time.</div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={busy} onClick={handleSubmit}>
        {busy ? 'Dropping…' : 'Drop it →'}
      </button>
      <p className="form-note">Submissions are reviewed by a human before they hit the board. Usually within a day. Rejections come with a reason, not a form letter.</p>
    </div>
  );
}
