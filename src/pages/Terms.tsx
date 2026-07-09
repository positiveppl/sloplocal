import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { agreeToTerms } from '../lib/data';

export default function Terms() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function completeSignup() {
    setError('');
    if (!user) {
      navigate('/login');
      return;
    }
    if (!agreed) {
      setError('Please confirm the submission rules before continuing.');
      return;
    }
    setBusy(true);
    const res = await agreeToTerms(user.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not save your confirmation.');
      return;
    }
    await refresh();
    toast("You're in. Drop responsibly.");
    navigate(from === '/confirm-terms' ? '/' : from, { replace: true });
  }

  if (!user) {
    return (
      <div className="narrow-wrap oauth-confirm">
        <Link to="/" className="back-link">← Back to the board</Link>
        <h1 className="page-title">Sign in first</h1>
        <p className="page-sub">Create an account or sign in before confirming the submission rules.</p>
        <Link to="/login" className="btn btn-primary">Sign in →</Link>
      </div>
    );
  }

  return (
    <div className="narrow-wrap oauth-confirm" style={{ maxWidth: 480 }}>
      <div className="oauth-confirm-logo">🥕 Slop Local</div>
      <h1 className="page-title">One quick thing</h1>
      <p className="page-sub">Before you start dropping slop, confirm you're in:</p>

      {error && <div className="form-error">{error}</div>}

      <div className="attestation-field">
        <input
          type="checkbox"
          id="oauth-attestation"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
        />
        <label htmlFor="oauth-attestation">
          I'll only submit projects I built or am authorized to represent. <strong>Submitting someone else's work gets my account permanently banned.</strong>
        </label>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: 13 }} disabled={!agreed || busy} onClick={completeSignup}>
        {busy ? 'Saving…' : "Let's go →"}
      </button>
    </div>
  );
}
