import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { BUILT_WITH_OPTIONS, CATS, CategorySlug, normalizeUrlInput, submitSlop } from '../lib/data';

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
  const [accessModel, setAccessModel] = useState('free');
  const [apiProvider, setApiProvider] = useState('');
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function toggleTag(t: string) {
    setTags(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }

  async function handleSubmit() {
    setError('');
    if (!user) { toast('Sign in first, then drop it.'); navigate('/login'); return; }
    if (!name.trim() || !url.trim() || !tagline.trim() || !cat || !description.trim()) {
      setError('Name, URL, one-liner, category, and recipe are required.');
      return;
    }
    if (!attested) {
      setError('Please confirm you built this before submitting.');
      return;
    }
    if (accessModel === 'byok' && !apiProvider.trim()) {
      setError('Pick which AI API key the project requires.');
      return;
    }
    const projectUrl = normalizeUrlInput(url);
    try { new URL(projectUrl); } catch { setError('That URL doesn\'t parse.'); return; }
    const submissionTags = [...tags];
    if (accessModel === 'byok') {
      submissionTags.push('BYOK', `${apiProvider.trim()} API key required`);
    } else if (accessModel === 'account') {
      submissionTags.push('Free account required');
    } else if (accessModel === 'freemium') {
      submissionTags.push('Freemium');
    }
    setBusy(true);
    const res = await submitSlop({
      name: name.trim(), url: projectUrl, tagline: tagline.trim(),
      description: description.trim(), category_slug: cat, built_with: submissionTags, submitter: user, attested,
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
      <p className="page-sub">Open, accessible, useful, made by you. That's the whole bar.</p>

      <div className="criteria">
        <div>✅ Open & accessible — free, useful freemium, open-source, or clearly labeled BYOK</div>
        <div>✅ Solves a real problem, raises a real issue, or serves a specific community</div>
        <div>✅ Includes a real recipe — what you designed, what AI helped with, and what was hard</div>
        <div>✅ Indie / small-team energy</div>
        <div>❌ No demos with no real use, content farms, SEO bait, or scams</div>
        <div>❌ No hidden payment, account, or API-key requirements</div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>Project name <span className="req">*</span></label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="PosterLab" />
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
        <label>Recipe / proof of craft <span className="req">*</span></label>
        <textarea value={description} maxLength={500} rows={5} onChange={e => setDescription(e.target.value)} placeholder="What did you design? What did AI help with? What was hard to get right? Keep it human. 500 max." />
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
        <label>Ingredients</label>
        <div className="tag-picker">
          {BUILT_WITH_OPTIONS.map(t => (
            <button key={t} className={`tag-pick ${tags.has(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Access model <span className="req">*</span></label>
        <select value={accessModel} onChange={e => setAccessModel(e.target.value)}>
          <option value="free">Free, no account/API key needed</option>
          <option value="account">Free account required</option>
          <option value="freemium">Freemium with useful free tier</option>
          <option value="byok">Bring your own AI API key</option>
        </select>
        <div className="hint">BYOK is allowed, but it must be obvious before someone clicks through.</div>
      </div>
      {accessModel === 'byok' && (
        <div className="field">
          <label>Required API key <span className="req">*</span></label>
          <select value={apiProvider} onChange={e => setApiProvider(e.target.value)}>
            <option value="">Pick one</option>
            <option value="Claude">Claude</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Gemini">Gemini</option>
            <option value="Other AI">Other AI</option>
          </select>
          <div className="hint">This appears as a listing tag, for example: BYOK · Claude API key required.</div>
        </div>
      )}
      <div className="field">
        <label>Screenshot</label>
        <input disabled placeholder="Auto-captured from your URL on approval" />
        <div className="hint">Screenshot capture happens at review time.</div>
      </div>

      <div className="attestation-field submission-attestation">
        <input
          type="checkbox"
          id="submission-attestation"
          required
          checked={attested}
          onChange={e => setAttested(e.target.checked)}
        />
        <label htmlFor="submission-attestation">
          I built this or am authorized to submit it. It's open and accessible, and I've put real time into it — not a throwaway demo.
        </label>
      </div>
      {error.includes('confirm') && <div className="attestation-error">⚠ Please confirm before submitting.</div>}

      <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={busy || !attested} onClick={handleSubmit}>
        {busy ? 'Dropping…' : 'Drop it →'}
      </button>
      <p className="form-note">Submissions are reviewed by a human before they hit the board. Usually within a day. Rejections come with a reason, not a form letter.</p>
    </div>
  );
}
