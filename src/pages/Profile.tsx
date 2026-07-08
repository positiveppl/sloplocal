import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import {
  ApiKey,
  CATS,
  Profile,
  Slop,
  createApiKey,
  fetchApiKeys,
  fetchByBuilder,
  fetchProfile,
  fmtVotes,
  revokeApiKey,
} from '../lib/data';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [slops, setSlops] = useState<Slop[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [label, setLabel] = useState('My Claude agent');
  const [newKey, setNewKey] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);

  useEffect(() => {
    if (!username) return;
    setProfile(undefined);
    fetchProfile(username).then(setProfile).catch(() => setProfile(null));
    fetchByBuilder(username).then(list => setSlops(list.sort((a, b) => b.vote_count - a.vote_count)));
  }, [username]);

  useEffect(() => {
    if (user && username === user.username) fetchApiKeys(user.id).then(setApiKeys).catch(() => setApiKeys([]));
    else setApiKeys([]);
  }, [user, username]);

  if (profile === undefined) return <div className="loading">Loading…</div>;
  if (profile === null) return <div className="empty">No builder by that handle.</div>;

  const score = slops.reduce((s, a) => s + a.vote_count, 0);
  const isOwnProfile = Boolean(user && user.username === profile.username);

  async function handleCreateKey() {
    if (!user || keyBusy) return;
    setKeyBusy(true);
    try {
      const created = await createApiKey(user.id, label);
      setNewKey(created.key);
      setApiKeys(prev => [created.record, ...prev]);
      toast('API key generated. Copy it now — it only shows once.');
    } catch {
      toast('Could not generate API key.');
    } finally {
      setKeyBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    await revokeApiKey(id);
    setApiKeys(prev => prev.filter(key => key.id !== id));
    toast('API key revoked.');
  }

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

      {isOwnProfile && (
        <section className="agent-access">
          <div className="section-kicker">Agent Access</div>
          <h2>Connect your AI agent to SLOP LOCAL.</h2>
          <p>Generate an API key so Claude, Cursor, or any MCP-compatible agent can submit projects and discover what is trending on your behalf.</p>

          <div className="key-create">
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="My Claude agent" />
            <button className="btn btn-primary" onClick={handleCreateKey} disabled={keyBusy}>
              {keyBusy ? 'Generating…' : 'Generate API Key'}
            </button>
          </div>

          {newKey && (
            <div className="key-reveal">
              <div className="hint">Copy this now. It will not be shown again.</div>
              <code>{newKey}</code>
            </div>
          )}

          <div className="key-list">
            {apiKeys.length === 0 && <div className="empty slim">No active agent keys yet.</div>}
            {apiKeys.map(key => (
              <div key={key.id} className="key-row">
                <div>
                  <strong>{key.label ?? 'Agent key'}</strong>
                  <span>{key.key_preview}</span>
                </div>
                <div className="key-meta">{key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}` : 'Never used'}</div>
                <button className="btn" onClick={() => handleRevoke(key.id)}>Revoke</button>
              </div>
            ))}
          </div>

          <Link to="/docs/agent" className="back-link">How to connect your agent →</Link>
        </section>
      )}

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
