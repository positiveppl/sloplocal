import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import { CATS, Slop, fetchPending, reviewSubmission } from '../lib/data';

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState<Slop[] | null>(null);

  async function load() {
    setPending(await fetchPending());
  }

  useEffect(() => {
    if (user?.is_admin) load();
  }, [user]);

  if (!user) return <div className="empty">Sign in first. Admins only past this point.</div>;
  if (!user.is_admin) return <div className="empty">Admins only. Nice try though.</div>;

  async function review(s: Slop, status: 'approved' | 'rejected') {
    let reason: string | undefined;
    if (status === 'rejected') {
      reason = window.prompt('Reason for rejection (the builder will see this):') ?? undefined;
      if (reason === undefined) return; // cancelled
    }
    await reviewSubmission(s.id, status, reason);
    toast(status === 'approved' ? `${s.name} is live on the board.` : `${s.name} rejected.`);
    load();
  }

  return (
    <div className="narrow-wrap">
      <Link to="/" className="back-link">← Back to the board</Link>
      <h1 className="page-title">Review queue</h1>
      <p className="page-sub">The bar: would you recommend this to a friend?</p>

      {pending === null && <div className="loading">Loading the queue…</div>}
      {pending && pending.length === 0 && <div className="empty">Queue's empty. Go build something.</div>}
      {pending && pending.map(s => (
        <div key={s.id} className="admin-row">
          <div className="app-name">{s.name}</div>
          <div className="app-tagline">{s.tagline}</div>
          {s.description && <div className="app-tagline" style={{ marginTop: 8 }}>{s.description}</div>}
          <div className="admin-meta">
            {CATS[s.category_slug]?.label ?? s.category_slug} · by @{s.builder_username} · {s.built_with.join(', ') || 'no tags'}
          </div>
          <div className="admin-actions">
            <a className="btn" href={s.url} target="_blank" rel="noopener noreferrer">Open site →</a>
            <button className="btn" onClick={() => review(s, 'approved')}>Approve</button>
            <button className="btn btn-danger" onClick={() => review(s, 'rejected')}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
