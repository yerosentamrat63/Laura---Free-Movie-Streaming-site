import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { fetchAnimeList } from '../lib/anilist';
import { useReveal } from '../lib/useReveal';

const TABS = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'season', label: '🌸 Popular This Season' },
  { id: 'top', label: '🏆 Top Rated' },
  { id: 'upcoming', label: '📅 Upcoming' }
];

const GENRES = ['Action', 'Romance', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Sci-Fi', 'Slice of Life', 'Sports', 'Thriller', 'Mecha'];

function seasonVars() {
  const now = new Date();
  const month = now.getMonth();
  const season = month < 2 ? 'WINTER' : month < 5 ? 'SPRING' : month < 8 ? 'SUMMER' : 'FALL';
  return { season, seasonYear: now.getFullYear() };
}

function buildQuery(tab, genre, search) {
  if (search) return { search, sort: 'SEARCH_MATCH' };
  if (genre) return { genre, sort: 'POPULARITY_DESC' };
  switch (tab) {
    case 'season':
      return { sort: 'POPULARITY_DESC', status: 'RELEASING', ...seasonVars() };
    case 'top':
      return { sort: 'SCORE_DESC', status: 'FINISHED' };
    case 'upcoming':
      return { sort: 'START_DATE', status: 'NOT_YET_RELEASED' };
    default:
      return { sort: 'TRENDING_DESC' };
  }
}

export default function Anime() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('trending');
  const [genre, setGenre] = useState('');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const list = await fetchAnimeList(buildQuery(tab, genre, search));
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setLoadError('Failed to load anime from AniList. Check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tab, genre, search]);

  useReveal(!loading, [items]);

  const heroBg = items[0]?.imgWide;

  const onPick = (item) => navigate(`/watch/anime/${item.id}/1/sub`);

  return (
    <div className="page-container">
      <section className="hero" style={{ height: '44vh' }}>
        <div
          className="hero-bg"
          style={{
            backgroundImage: heroBg
              ? `url(${heroBg})`
              : 'url(https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&q=70)'
          }}
        />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-tag">Now Streaming</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(52px,7vw,90px)' }}>ANIME</h1>
          <p className="hero-desc">Subbed &amp; dubbed episodes, updated daily. Picked straight from AniList.</p>
        </div>
      </section>

      <div className="filter-bar" style={{ padding: '0 72px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search anime…"
          style={{
            flex: '1 1 240px',
            maxWidth: '360px',
            background: 'var(--gray)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            padding: '10px 14px',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '1px',
            outline: 'none'
          }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setGenre(genre === g ? '' : g)}
              style={{
                background: genre === g ? 'var(--red)' : 'none',
                border: `1px solid ${genre === g ? 'var(--red)' : 'rgba(255,255,255,0.15)'}`,
                color: genre === g ? '#fff' : 'var(--text-dim)',
                padding: '7px 12px',
                fontFamily: 'var(--mono)',
                fontSize: '9px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {!search && (
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab${tab === t.id && !genre ? ' active' : ''}`}
              onClick={() => { setTab(t.id); setGenre(''); }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading && <div style={{ padding: '40px 72px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--text-dim)' }}>LOADING…</div>}
      {loadError && <div style={{ padding: '0 72px 24px', color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '2px' }}>{loadError}</div>}

      {!loading && !loadError && items.length === 0 && (
        <div style={{ padding: '0 72px 48px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--text-dim)' }}>
          NOTHING FOUND{search ? ` FOR "${search}"` : ''}.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="content-grid reveal">
          {items.map(item => (
            <div key={item.id} onClick={() => onPick(item)} style={{ cursor: 'pointer' }}>
              <div className="grid-card">
                <img src={item.img} alt={item.title} loading="lazy" />
                <div className="grid-card-overlay">
                  <div className="grid-card-title">{item.title}</div>
                  <div className="grid-card-meta">
                    <span className="match">{item.match}/100 Rating</span> · {item.year || '—'}
                    {item.episodes ? ` · ${item.episodes} EP` : ''}
                  </div>
                  <div className="grid-card-meta" style={{ marginTop: '4px', opacity: .7 }}>
                    {(item.genres || []).slice(0, 3).join(' · ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
}
