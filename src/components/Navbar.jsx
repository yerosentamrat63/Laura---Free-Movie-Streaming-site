import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Navbar({ openSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <NavLink to="/" className="nav-logo">laura<span>.</span></NavLink>

      <ul className={`nav-links ${mobileMenu ? 'open' : ''}`}>
        {[['/', 'Home'], ['/series', 'Series'], ['/films', 'Films'], ['/new-hot', 'New & Hot'], ['/browse', 'Browse']].map(([path, label]) => (
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
            <button className="nav-btn outline" style={{ fontSize: '9px', padding: '7px 14px' }} onClick={signOut}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="nav-btn" onClick={() => navigate('/signin')}>Sign In</button>
        )}
      </div>
    </nav>
  );
}
