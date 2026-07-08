import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import { DEMO_MODE, getSessionProfile, onAuthChange, Profile, signOut } from './lib/data';
import Home from './pages/Home';
import Submit from './pages/Submit';
import Detail from './pages/Detail';
import ProfilePage from './pages/Profile';
import Manifesto from './pages/Manifesto';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AgentDocs from './pages/AgentDocs';

// ============ CONTEXTS ============

interface AuthCtx {
  user: Profile | null;
  refresh: () => Promise<void>;
}
const AuthContext = createContext<AuthCtx>({ user: null, refresh: async () => {} });
export const useAuth = () => useContext(AuthContext);

const ToastContext = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

// ============ LAYOUT PIECES ============

const TICKER = [
  'built fast', 'built local', 'not sorry', 'AI-assisted ≠ low effort',
  'not a filet — but it\'ll feed you', 'a potluck, not a portfolio',
  'speed of build ≠ quality of output', 'drop your slop, feed your neighbors',
];

function Ticker() {
  const items = [...TICKER, ...TICKER].map((m, i) => <span key={i}>🥕 {m}</span>);
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">{items}</div>
    </div>
  );
}

function Nav() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleSignOut() {
    await signOut();
    await refresh();
    toast('Signed out.');
    navigate('/');
  }

  return (
    <nav>
      <div className="wrap nav-inner">
        <Link to="/" className="logo">
          <span className="logo-carrot">🥕</span>
          <div className="logo-text">
            <div className="wordmark">Slop Local</div>
            <div className="tagline">free · indie · vibe-coded</div>
          </div>
        </Link>
        <div className="nav-links">
          <Link to="/manifesto" className="nav-link hide-sm">Manifesto</Link>
          <Link to="/docs/agent" className="nav-link hide-sm">Agent API</Link>
          {user?.is_admin && <Link to="/admin" className="nav-link hide-sm">Admin</Link>}
          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="nav-link hide-sm">@{user.username}</Link>
              <button className="btn hide-sm" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="btn hide-sm">Sign in</Link>
          )}
          <Link to="/submit" className="btn btn-primary">Drop your slop ↗</Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap footer-inner">
        <div className="footer-motto">🥕 Slop Local — built fast · built local · not sorry</div>
        <div className="footer-agent">
          <span className="footer-agent-icon">⬡</span>
          <span>Agent-native</span>
          <span className="footer-divider">·</span>
          <Link to="/docs/agent" className="footer-agent-link">slop-local-mcp on npm →</Link>
        </div>
        <div className="footer-motto">sloplocal.com · est. 2026</div>
      </div>
    </footer>
  );
}

// ============ APP ============

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const refresh = useCallback(async () => {
    setUser(await getSessionProfile());
  }, []);

  useEffect(() => {
    refresh();
    const unsub = onAuthChange(refresh);
    return unsub;
  }, [refresh]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2600);
  }, []);

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ user, refresh }}>
        <ToastContext.Provider value={toast}>
          {DEMO_MODE && (
            <div className="demo-banner">
              Demo mode — no Supabase configured. Data is seeded and resets on reload. See README to go live.
            </div>
          )}
          <Nav />
          <Ticker />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/slop/:slug" element={<Detail />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/docs/agent" element={<AgentDocs />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
          <Footer />
          <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}
