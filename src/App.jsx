import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Cursor from './components/Cursor';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Modal from './components/Modal';
import SearchOverlay from './components/SearchOverlay';
import Home from './pages/Home';
import Series from './pages/Series';
import Films from './pages/Films';
import NewHot from './pages/NewHot';
import MyList from './pages/MyList';
import Browse from './pages/Browse';
import SignIn from './pages/SignIn';
import Watch from './pages/Watch';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/signin" replace />;
}

function AppInner() {
  const [modal, setModal] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Re-run reveal observer on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.08 });
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
      return () => obs.disconnect();
    }, 100);
  }, [location.pathname]);

  // Keyboard shortcut for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isSignIn = location.pathname === '/signin';
  const isWatch = location.pathname.startsWith('/watch');

  useEffect(() => {
    if (isWatch) document.body.classList.add('watch-mode');
    else document.body.classList.remove('watch-mode');
    return () => document.body.classList.remove('watch-mode');
  }, [isWatch]);

  return (
    <>
      <Loader />
      {!isWatch && <Cursor />}
      {!isSignIn && !isWatch && <Navbar openSearch={() => setSearchOpen(true)} />}

      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<Home onSelect={setModal} />} />
        <Route path="/series" element={<Series onSelect={setModal} />} />
        <Route path="/films" element={<Films onSelect={setModal} />} />
        <Route path="/new-hot" element={<NewHot onSelect={setModal} />} />
        <Route path="/my-list" element={<ProtectedRoute><MyList onSelect={setModal} /></ProtectedRoute>} />
        <Route path="/browse" element={<Browse onSelect={setModal} />} />
        <Route path="/watch/:mediaType/:tmdbId" element={<Watch />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {modal && <Modal item={modal} onClose={() => setModal(null)} />}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => { setModal(item); setSearchOpen(false); }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
