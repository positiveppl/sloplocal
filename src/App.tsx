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
  'Fresh slop daily',
  'Picked at peak vibes',
  'Know your farmer. Know your slop.',
  'My agent wrote this. I take full credit.',
  'Speed of build ≠ quality of output',
  'Drop your slop, feed your neighbors',
  'Built fast, built local',
  'A potluck, not a portfolio',
  'AI-assisted ≠ low effort',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    await signOut();
    await refresh();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    toast('Signed out.');
    navigate('/');
  }

  function closeMenus() {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      const clickedHamburger = target instanceof Element && target.closest('.hamburger');
      if (mobileMenuOpen && !clickedHamburger && !menuRef.current?.contains(target)) setMobileMenuOpen(false);
      if (userMenuOpen && !userMenuRef.current?.contains(target)) setUserMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen, userMenuOpen]);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 10) closeMenus();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav>
      <div className="wrap nav-inner">
        <Link to="/" className="logo" onClick={closeMenus}>
          <span className="logo-carrot">🥕</span>
          <div className="logo-text">
            <div className="wordmark">Slop Local</div>
            <div className="tagline">Fresh slop daily.</div>
          </div>
        </Link>
        <div className="nav-right">
          <Link to="/docs/agent" className="nav-link">New Builder?</Link>
          {user ? (
            <div className="user-menu" ref={userMenuRef}>
              <button className="user-menu-trigger" onClick={() => setUserMenuOpen(open => !open)} aria-expanded={userMenuOpen}>
                <span className="user-avatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : '🥕'}</span>
                <span>@{user.username}</span>
                <span aria-hidden="true">▾</span>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <Link to={`/profile/${user.username}`} className="dropdown-item" onClick={closeMenus}>Profile</Link>
                  <Link to={`/profile/${user.username}`} className="dropdown-item" onClick={closeMenus}>Settings</Link>
                  <Link to={`/profile/${user.username}`} className="dropdown-item" onClick={closeMenus}>Agent Access</Link>
                  {user.is_admin && <Link to="/admin" className="dropdown-item" onClick={closeMenus}>Admin</Link>}
                  <button className="dropdown-item" onClick={handleSignOut}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn">Sign in</Link>
          )}
          <Link to="/submit" className="btn btn-primary">Drop your slop ↗</Link>
        </div>
        <button className="hamburger" onClick={() => setMobileMenuOpen(open => !open)} aria-expanded={mobileMenuOpen} aria-label="Open navigation">
          ≡
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-menu" ref={menuRef}>
          <Link to="/submit" className="mobile-menu-item primary" onClick={closeMenus}>Drop your slop ↗</Link>
          <div className="mobile-menu-divider" />
          <Link to="/docs/agent" className="mobile-menu-item" onClick={closeMenus}>New Builder?</Link>
          <Link to="/manifesto" className="mobile-menu-item" onClick={closeMenus}>Manifesto</Link>
          <Link to="/docs/agent" className="mobile-menu-item" onClick={closeMenus}>Agent Access</Link>
          <div className="mobile-menu-divider" />
          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="mobile-menu-item" onClick={closeMenus}>@{user.username}</Link>
              <Link to={`/profile/${user.username}`} className="mobile-menu-item" onClick={closeMenus}>Settings</Link>
              {user.is_admin && <Link to="/admin" className="mobile-menu-item" onClick={closeMenus}>Admin</Link>}
              <button className="mobile-menu-item" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="mobile-menu-item" onClick={closeMenus}>Sign in</Link>
          )}
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">🥕 SLOP LOCAL</div>
            <div className="footer-tagline">Built local. Shipped fast. Not sorry.</div>
          </div>
          <div className="footer-new-builder">
            <Link to="/docs/agent" className="footer-new-builder-label">New Builder?</Link>
            <Link to="/docs/agent" className="footer-new-builder-sub">From Prompt to Product →</Link>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-links">
          <Link to="/manifesto" className="footer-link">Manifesto →</Link>
          <a href="https://github.com/positiveppl/sloplocal" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub →</a>
          <Link to="/docs/agent" className="footer-link">Agent docs →</Link>
        </div>

        <div className="footer-divider" />

        <div className="footer-agent">
          <span className="footer-agent-icon">⬡</span>
          <span>Agent-native</span>
          <span className="footer-dot">·</span>
          <Link to="/docs/agent" className="footer-agent-link">slop-local-mcp on npm →</Link>
        </div>
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
