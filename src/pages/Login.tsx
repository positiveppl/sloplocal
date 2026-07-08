import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { DEMO_MODE, sanitizeUsername, signInEmail, signInGitHub, signUpEmail } from '../lib/data';

export default function Login() {
  const { refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleEmail() {
    setError('');
    if (!DEMO_MODE && (!email.trim() || !password)) { setError('Email and password, both.'); return; }
    const cleanHandle = sanitizeUsername(handle);
    if (mode === 'up' && !cleanHandle) { setError('Pick a public handle. No email addresses on the board.'); return; }
    if (mode === 'up' && handle.includes('@')) { setError('Use a handle, not an email address.'); return; }
    setBusy(true);
    const res = mode === 'in' ? await signInEmail(email, password) : await signUpEmail(email, password, cleanHandle);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'That didn\'t work.'); return; }
    await refresh();
    toast(mode === 'in' ? 'Signed in.' : 'Account created. Welcome to the market.');
    navigate('/');
  }

  async function handleGitHub() {
    await signInGitHub();
    if (DEMO_MODE) { await refresh(); toast('Signed in (demo).'); navigate('/'); }
    // In live mode, OAuth redirects away and back.
  }

  return (
    <div className="narrow-wrap" style={{ maxWidth: 420 }}>
      <Link to="/" className="back-link">← Back to the board</Link>
      <h1 className="page-title">{mode === 'in' ? 'Sign in' : 'Sign up'}</h1>
      <p className="page-sub">You need an account to vote and drop slop. That's the only reason.</p>

      {error && <div className="form-error">{error}</div>}

      <button className="btn" style={{ width: '100%', padding: 13, marginBottom: 24 }} onClick={handleGitHub}>
        Continue with GitHub
      </button>

      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      {mode === 'up' && (
        <div className="field">
          <label>Public handle</label>
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="acedout" />
          <div className="hint">Shown as @{sanitizeUsername(handle) || 'handle'}. Do not use your email.</div>
        </div>
      )}
      <div className="field">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: 13 }} disabled={busy} onClick={handleEmail}>
        {busy ? 'One sec…' : mode === 'in' ? 'Sign in →' : 'Create account →'}
      </button>

      <p className="form-note">
        {mode === 'in' ? 'No account yet? ' : 'Already have one? '}
        <button className="nav-link" style={{ padding: 0, textDecoration: 'underline' }}
                onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); }}>
          {mode === 'in' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
      {DEMO_MODE && <p className="form-note">Demo mode: any button signs you in as @you with admin rights, so you can try the whole flow including the review queue.</p>}
    </div>
  );
}
