import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATS, Profile, Slop, fetchByBuilder, fetchProfile, fmtVotes } from '../lib/data';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [slops, setSlops] = useState<Slop[]>([]);

  useEffect(() => {
    if (!username) return;
    setProfile(undefined);
    fetchProfile(username).then(setProfile).catch(() => setProfile(null));
    fetchByBuilder(username).then(list => setSlops(list.sort((a, b) => b.vote_count - a.vote_count)));
  }, [username]);

  if (profile === undefined) return <div className="loading">Loading…</div>;
  if (profile === null) return <div className="empty">No builder by that handle.</div>;

  const score = slops.reduce((s, a) => s + a.vote_count, 0);

  return (
    <div className="wrap">
      <div className="profile-head">
        <div className="avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : '🥕'}</div>
        <div>
          <div className="profile-handle">@{profile.username}</div>
          {profile.bio && <div className="profile-bio">{profile.bio}</div>}
        </div>
        <div className="slop-score stat">
          <div className="stat-num">{fmtVotes(score)}</div>
          <div className="stat-label">Slop score</div>
        </div>
      </div>

      {slops.length === 0 && <div className="empty">No approved slop yet. It's coming.</div>}
      {slops.map(s => (
        <div key={s.id} className="row" style={{ gridTemplateColumns: '60px 1fr 120px 80px' }} onClick={() => navigate(`/slop/${s.slug}`)}>
          <div className="thumb">{s.screenshot_url ? <img src={s.screenshot_url} alt="" /> : '🥕'}</div>
          <div className="app-info">
            <div className="app-name">{s.name}</div>
            <div className="app-tagline">{s.tagline}</div>
            <div className="built-with">{s.built_with.map(b => <span key={b} className="bw-tag">{b}</span>)}</div>
          </div>
          <div className="cat-tag hide-sm">{CATS[s.category_slug]?.label ?? s.category_slug}</div>
          <div className="vote-btn" style={{ textAlign: 'center' }}>▲ {fmtVotes(s.vote_count)}</div>
        </div>
      ))}
      <div style={{ marginTop: 24 }}>
        <Link to="/" className="back-link">← Back to the board</Link>
      </div>
    </div>
  );
}
