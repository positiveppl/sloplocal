import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import {
  CATS, CategorySlug, Slop, fetchApproved, fetchMyVotes, fmtVotes,
  fmtBuiltWithTags, hotScore, isHot, toggleVote,
} from '../lib/data';

type Sort = 'hot' | 'new' | 'top';
const SORTS: [Sort, string][] = [['hot', 'In season'], ['new', 'Fresh drops'], ['top', 'This week\'s yield']];

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [slops, setSlops] = useState<Slop[] | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<'all' | CategorySlug>('all');
  const [sort, setSort] = useState<Sort>('hot');

  useEffect(() => {
    fetchApproved().then(setSlops).catch(() => setSlops([]));
  }, []);

  useEffect(() => {
    if (user) fetchMyVotes(user.id).then(v => setVoted(new Set(v)));
    else setVoted(new Set());
  }, [user]);

  const list = useMemo(() => {
    if (!slops) return null;
    let l = slops.filter(s => cat === 'all' || s.category_slug === cat);
    if (sort === 'hot') l = [...l].sort((a, b) => hotScore(b.vote_count, b.created_at) - hotScore(a.vote_count, a.created_at));
    if (sort === 'new') l = [...l].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'top') l = [...l].sort((a, b) => b.vote_count - a.vote_count);
    return l;
  }, [slops, cat, sort]);

  const stats = useMemo(() => {
    if (!slops) return { tools: 0, votes: 0, builders: 0 };
    return {
      tools: slops.length,
      votes: slops.reduce((s, a) => s + a.vote_count, 0),
      builders: new Set(slops.map(a => a.builder_username)).size,
    };
  }, [slops]);

  async function handleVote(s: Slop) {
    if (!user) { toast('Sign in to vote this up.'); navigate('/login'); return; }
    const was = voted.has(s.id);
    // optimistic
    setVoted(prev => { const n = new Set(prev); was ? n.delete(s.id) : n.add(s.id); return n; });
    setSlops(prev => prev!.map(x => x.id === s.id ? { ...x, vote_count: x.vote_count + (was ? -1 : 1) } : x));
    try {
      await toggleVote(s.id, user.id, was);
      if (!was) toast('Vote counted. Good taste.');
    } catch {
      // rollback
      setVoted(prev => { const n = new Set(prev); was ? n.add(s.id) : n.delete(s.id); return n; });
      setSlops(prev => prev!.map(x => x.id === s.id ? { ...x, vote_count: x.vote_count + (was ? 1 : -1) } : x));
      toast('Vote didn\'t stick. Try again.');
    }
  }

  return (
    <div className="wrap">
      <div className="hero">
        <div className="hero-left">
          <h1>Fresh slop<br />daily.</h1>
          <p>A farmers market for free AI-built tools, games, and utilities. Shop local. Know your farmer. Know your slop.</p>
        </div>
        <div className="hero-stats">
          <div className="stats-block">
            <div className="stat"><div className="stat-num">{stats.tools}</div><div className="stat-label">Tools listed</div></div>
            <div className="stat"><div className="stat-num">{fmtVotes(stats.votes)}</div><div className="stat-label">Votes cast</div></div>
            <div className="stat"><div className="stat-num">{stats.builders}</div><div className="stat-label">Builders</div></div>
          </div>
          {stats.tools < 50 && (
            <div className="stats-early">
              <Link to={user ? '/submit' : '/signup'} className="stats-early-link">Be one of the first builders here →</Link>
            </div>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>Today&apos;s harvest</button>
          {(Object.keys(CATS) as CategorySlug[]).map(k => (
            <button key={k} className={`chip ${cat === k ? 'active' : ''}`} onClick={() => setCat(k)}>{CATS[k].label}</button>
          ))}
        </div>
        <div className="filter-group">
          {SORTS.map(([k, label]) => (
            <button key={k} className={`chip ${sort === k ? 'sort-active' : ''}`} onClick={() => setSort(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="listing-cta">
        <Link to={user ? '/submit' : '/signup'} className="listing-cta-btn">
          {user ? '↗ Drop your slop' : '↗ List your tool free — takes 2 minutes'}
        </Link>
      </div>

      <div className="board-head">
        <span>#</span><span></span><span>The slop report</span><span>Category</span><span>Votes</span><span>Builder</span>
      </div>

      {!list && <div className="loading">Loading the board…</div>}
      {list && list.length === 0 && <div className="empty">Nothing in season yet. Be the first to drop something good.</div>}
      {list && list.map((s, i) => (
        <div key={s.id} className="row" onClick={() => navigate(`/slop/${s.slug}`)} role="button" tabIndex={0}
             onKeyDown={e => { if (e.key === 'Enter') navigate(`/slop/${s.slug}`); }}>
          <div className={`rank ${i < 2 ? 'top' : ''}`}>#{i + 1}</div>
          <div className="thumb">{s.screenshot_url ? <img src={s.screenshot_url} alt="" /> : '🥕'}</div>
          <div className="app-info">
            <div className="app-name">{s.name}{isHot(s) && <span className="hot-badge">hot</span>}</div>
            <div className="listing-badge">Small batch · vibe coded</div>
            <div className="app-tagline">{s.tagline}</div>
            <div className="built-with">{fmtBuiltWithTags(s.built_with).map(tag => <span key={tag} className="bw-tag">{tag}</span>)}</div>
          </div>
          <div className="cat-tag hide-sm">{CATS[s.category_slug]?.label ?? s.category_slug}</div>
          <div className="row-meta">
            <button className={`vote-btn ${voted.has(s.id) ? 'voted' : ''}`}
                    onClick={e => { e.stopPropagation(); handleVote(s); }}>
              ▲ {fmtVotes(s.vote_count)}
            </button>
            <div className="builder">
              by <Link className="handle" to={`/profile/${s.builder_username}`} onClick={e => e.stopPropagation()}>@{s.builder_username}</Link>
            </div>
          </div>
        </div>
      ))}

      <div className="agent-callout">
        <div className="agent-callout-left">
          <span className="agent-callout-label">Built for agents too</span>
          <p>Your AI agent can submit tools, browse listings, and find market gaps via MCP.</p>
        </div>
        <Link to="/docs/agent" className="btn">Connect your agent →</Link>
      </div>
    </div>
  );
}
