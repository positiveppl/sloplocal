import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { CATS, Slop, fetchByBuilder, fetchBySlug, fetchMyVotes, flagSubmission, fmtBuiltWithTags, fmtVotes, toggleVote } from '../lib/data';

const FLAG_REASONS = [
  ['spam', 'It’s spam'],
  ['not_free', 'It’s not actually free'],
  ['broken', 'The link is broken'],
  ['low_effort', 'Low effort / no real value'],
  ['harmful', 'Harmful content'],
] as const;

export default function Detail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [slop, setSlop] = useState<Slop | null | undefined>(undefined);
  const [more, setMore] = useState<Slop[]>([]);
  const [voted, setVoted] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState<(typeof FLAG_REASONS)[number][0]>('spam');

  useEffect(() => {
    if (!slug) return;
    setSlop(undefined);
    fetchBySlug(slug).then(async s => {
      setSlop(s);
      if (s) {
        const others = await fetchByBuilder(s.builder_username);
        setMore(others.filter(o => o.slug !== s.slug).sort((a, b) => b.vote_count - a.vote_count).slice(0, 3));
        if (user) {
          const v = await fetchMyVotes(user.id);
          setVoted(v.has(s.id));
        }
      }
    }).catch(() => setSlop(null));
  }, [slug, user]);

  async function handleVote() {
    if (!slop) return;
    if (!user) { toast('Sign in to vote this up.'); navigate('/login'); return; }
    const was = voted;
    setVoted(!was);
    setSlop({ ...slop, vote_count: slop.vote_count + (was ? -1 : 1) });
    try {
      await toggleVote(slop.id, user.id, was);
      if (!was) toast('Vote counted. Good taste.');
    } catch {
      setVoted(was);
      setSlop(s => s ? { ...s, vote_count: s.vote_count + (was ? 1 : -1) } : s);
      toast('Vote didn\'t stick. Try again.');
    }
  }

  async function handleFlag() {
    if (!slop) return;
    if (!user) { toast('Sign in to flag this listing.'); navigate('/login'); return; }
    try {
      await flagSubmission(slop.id, user.id, flagReason);
      toast('Flag submitted. Thanks for keeping the board clean.');
      setFlagOpen(false);
    } catch (error: any) {
      toast(error.message ?? 'Flag did not submit.');
    }
  }

  if (slop === undefined) return <div className="loading">Loading…</div>;
  if (slop === null) return <div className="empty">Nothing at this address. It may have been rejected, or never existed.</div>;

  return (
    <div className="detail-wrap">
      <Link to="/" className="back-link">← Back to the board</Link>
      <div className="detail-hero">{slop.screenshot_url ? <img src={slop.screenshot_url} alt={slop.name} /> : '🥕'}</div>
      <div className="detail-top">
        <div className="detail-title">{slop.name}</div>
        <button className={`vote-btn ${voted ? 'voted' : ''}`} style={{ width: 'auto', fontSize: 14, padding: '10px 18px' }} onClick={handleVote}>
          ▲ {fmtVotes(slop.vote_count)}
        </button>
      </div>
      {slop.status !== 'approved' && <span className="status-badge">{slop.status}</span>}
      <div className="listing-badge">Small batch · vibe coded</div>
      <div className="detail-tagline">{slop.tagline}</div>
      <div className="detail-meta">
        <span className="cat-tag">{CATS[slop.category_slug]?.full ?? slop.category_slug}</span>
        <span className="builder">by <Link className="handle" to={`/profile/${slop.builder_username}`}>@{slop.builder_username}</Link></span>
        <span className="built-with">{fmtBuiltWithTags(slop.built_with).map(tag => <span key={tag} className="bw-tag">{tag}</span>)}</span>
        <a className="btn" style={{ marginLeft: 'auto' }} href={slop.url} target="_blank" rel="noopener noreferrer">Visit site →</a>
      </div>
      {slop.description && <div className="detail-desc">{slop.description}</div>}

      <div className="flag-box">
        {!flagOpen ? (
          <button className="flag-toggle" onClick={() => setFlagOpen(true)}>⚑ Flag this listing</button>
        ) : (
          <div className="flag-form">
            <div className="section-kicker">Why are you flagging this?</div>
            {FLAG_REASONS.map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="flag-reason" checked={flagReason === value} onChange={() => setFlagReason(value)} />
                {label}
              </label>
            ))}
            <div className="admin-actions">
              <button className="btn btn-danger" onClick={handleFlag}>Submit flag</button>
              <button className="btn" onClick={() => setFlagOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {more.length > 0 && (
        <>
          <div className="more-head">More from @{slop.builder_username}</div>
          {more.map(m => (
            <div key={m.id} className="row" style={{ gridTemplateColumns: '60px 1fr 80px' }} onClick={() => navigate(`/slop/${m.slug}`)}>
              <div className="thumb">{m.screenshot_url ? <img src={m.screenshot_url} alt="" /> : '🥕'}</div>
              <div className="app-info">
                <div className="app-name">{m.name}</div>
                <div className="listing-badge">Small batch · vibe coded</div>
                <div className="app-tagline">{m.tagline}</div>
              </div>
              <div className="vote-btn" style={{ textAlign: 'center' }}>▲ {fmtVotes(m.vote_count)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
