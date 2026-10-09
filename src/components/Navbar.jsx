import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Navbar({ openSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!confirmOut) return;
    const onKey = (e) => { if (e.key === 'Escape') setConfirmOut(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmOut]);

  const handleSignOut = async () => {
    setConfirmOut(false);
    setMobileMenu(false);
    await signOut();
    navigate('/signin');
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  return (
    <>
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <NavLink to="/" className="nav-logo">laura<span>.</span></NavLink>

      <ul className={`nav-links ${mobileMenu ? 'open' : ''}`}>
        {[['/', 'Home'], ['/series', 'Series'], ['/films', 'Films'], ['/anime', 'Anime'], ['/new-hot', 'New & Hot'], ['/browse', 'Browse']].map(([path, label]) => (
          <li key={path}>
            <NavLink to={path} className={({ isActive }) => isActive ? 'active' : ''} end={path === '/'} onClick={() => setMobileMenu(false)}>
              {label}
            </NavLink>
          </li>
        ))}
        {user && (
          <li>
            <NavLink to="/my-list" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileMenu(false)}>
              My List
            </NavLink>
          </li>
        )}
      </ul>

      <div className="nav-right">
        <button className="nav-mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? '✕' : '☰'}
        </button>
        <button className="nav-search-btn" onClick={openSearch}>⌕</button>
        {user ? (
          <div className="nav-user">
            <div
              className="nav-avatar"
              title={userName}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--red)', color: 'var(--white)', fontSize: '14px', fontFamily: 'var(--display)' }}
            >
              {userName ? userName.charAt(0).toUpperCase() : '?'}
            </div>
            <button className="nav-btn outline" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={() => setConfirmOut(true)}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="nav-btn" onClick={() => navigate('/signin')}>Sign In</button>
        )}
      </div>
    </nav>

    {confirmOut && (
      <div className="confirm-overlay" onClick={e => e.target === e.currentTarget && setConfirmOut(false)}>
        <div className="confirm-box">
          <div className="confirm-title">SIGN OUT?</div>
          <p className="confirm-text">You'll need to sign in again to access your list, reminders and history.</p>
          <div className="confirm-actions">
            <button className="confirm-btn ghost" onClick={() => setConfirmOut(false)}>Cancel</button>
            <button className="confirm-btn" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
