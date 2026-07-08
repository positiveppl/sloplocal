import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import {
  ApiKey,
  CATS,
  Profile,
  Slop,
  apiAccessUnlock,
  changePassword,
  createApiKey,
  fetchApiKeys,
  fetchByBuilder,
  fetchProfile,
  fmtBuiltWithTag,
  fmtVotes,
  revokeApiKey,
  sanitizeUsername,
  updateProfile,
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
  const [handleDraft, setHandleDraft] = useState('');
  const [displayDraft, setDisplayDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

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

  useEffect(() => {
    if (!profile) return;
    setHandleDraft(profile.username);
    setDisplayDraft(profile.display_name ?? '');
    setBioDraft(profile.bio ?? '');
  }, [profile]);

  if (profile === undefined) return <div className="loading">Loading…</div>;
  if (profile === null) return <div className="empty">No builder by that handle.</div>;

  const score = slops.reduce((s, a) => s + a.vote_count, 0);
  const isOwnProfile = Boolean(user && user.username === profile.username);
  const apiUnlock = apiAccessUnlock(profile);

  async function handleCreateKey() {
    if (!user || keyBusy) return;
    setKeyBusy(true);
    try {
      const created = await createApiKey(user.id, label);
      setNewKey(created.key);
      setApiKeys(prev => [created.record, ...prev]);
      toast('API key generated. Copy it now — it only shows once.');
    } catch (error: any) {
      toast(error.message ?? 'Could not generate API key.');
    } finally {
      setKeyBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    await revokeApiKey(id);
    setApiKeys(prev => prev.filter(key => key.id !== id));
    toast('API key revoked.');
  }

  async function handleProfileSave() {
    if (!user || !profile || profileBusy) return;
    const cleanHandle = sanitizeUsername(handleDraft);
    if (!cleanHandle) { toast('Pick a public handle.'); return; }
    if (handleDraft.includes('@')) { toast('Use a handle, not an email address.'); return; }

    setProfileBusy(true);
    const result = await updateProfile({
      id: user.id,
      username: cleanHandle,
      display_name: displayDraft,
      bio: bioDraft,
    });
    setProfileBusy(false);

    if (!result.ok || !result.profile) {
      toast(result.error ?? 'Could not update profile.');
      return;
    }

    setProfile(result.profile);
    toast('Profile updated.');
    if (result.profile.username !== username) navigate(`/profile/${result.profile.username}`, { replace: true });
  }

  async function handlePasswordChange() {
    if (passwordBusy) return;
    if (passwordDraft.length < 8) { toast('Use at least 8 characters.'); return; }
    if (passwordDraft !== passwordConfirm) { toast('Passwords do not match.'); return; }

    setPasswordBusy(true);
    const result = await changePassword(passwordDraft);
    setPasswordBusy(false);

    if (!result.ok) {
      toast(result.error ?? 'Could not update password.');
      return;
    }

    setPasswordDraft('');
    setPasswordConfirm('');
    toast('Password updated.');
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
        <section className="profile-settings">
          <div className="section-kicker">Profile Settings</div>
          <h2>Public profile</h2>
          <p>Your handle is public and appears on submissions. Keep email addresses out of it.</p>
          <div className="settings-grid">
            <div className="field">
              <label>Public handle</label>
              <input value={handleDraft} onChange={e => setHandleDraft(e.target.value)} placeholder="acedout" />
              <div className="hint">Shown as @{sanitizeUsername(handleDraft) || 'handle'}.</div>
            </div>
            <div className="field">
              <label>Display name</label>
              <input value={displayDraft} onChange={e => setDisplayDraft(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea value={bioDraft} maxLength={240} rows={3} onChange={e => setBioDraft(e.target.value)} placeholder="What are you building?" />
            <div className="hint">{240 - bioDraft.length} left</div>
          </div>
          <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileBusy}>
            {profileBusy ? 'Saving…' : 'Save profile'}
          </button>

          <div className="settings-divider" />
          <h2>Change password</h2>
          <p>Update the password for email sign-in. Magic links will still work.</p>
          <div className="settings-grid">
            <div className="field">
              <label>New password</label>
              <input type="password" value={passwordDraft} onChange={e => setPasswordDraft(e.target.value)} placeholder="8 characters minimum" />
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Repeat new password" />
            </div>
          </div>
          <button className="btn" onClick={handlePasswordChange} disabled={passwordBusy || !passwordDraft || !passwordConfirm}>
            {passwordBusy ? 'Updating…' : 'Update password'}
          </button>
        </section>
      )}

      {isOwnProfile && (
        <section className="agent-access">
          <div className="section-kicker">Agent Access</div>
          <h2>Connect your AI agent to SLOP LOCAL.</h2>
          <p>Generate an API key so Claude, Cursor, or any MCP-compatible agent can submit projects and discover what is trending on your behalf.</p>

          {!apiUnlock.unlocked && (
            <div className="agent-lock">
              Agent Access unlocks in {apiUnlock.hoursRemaining} hours.
              <span>We wait 48 hours before granting API access — keeps the quality high.</span>
            </div>
          )}

          <div className="key-create">
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="My Claude agent" />
            <button className="btn btn-primary" onClick={handleCreateKey} disabled={keyBusy || !apiUnlock.unlocked}>
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
            <div className="listing-badge">Small batch · vibe coded</div>
            <div className="app-tagline">{s.tagline}</div>
            <div className="built-with">{s.built_with.map(b => <span key={b} className="bw-tag">{fmtBuiltWithTag(b)}</span>)}</div>
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
