import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { tmdb, mapTMDBToContent, fetchTMDB } from '../lib/tmdb';

export default function NewHot({ onSelect }) {
  const [tab, setTab] = useState('watching');
  const [watching, setWatching] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [top10, setTop10] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dayRes, weekRes, upcomingRes] = await Promise.all([
          tmdb.getTrending('all', 'day'),
          tmdb.getTrending('all', 'week'),
          fetchTMDB('/movie/upcoming', { region: 'US' })
        ]);

        setWatching(dayRes.results.map(i => mapTMDBToContent(i)).slice(0, 15));
        setTop10(weekRes.results.map(i => mapTMDBToContent(i)).slice(0, 10));
        setComingSoon(upcomingRes.results.map(i => mapTMDBToContent(i, 'movie')).slice(0, 15));
      } catch (e) {
        console.error("Failed to load New & Hot", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [tab, loading]);

  return (
    <div className="page-container">
      {/* PAGE HERO */}
      <section className="hero" style={{ height: '44vh' }}>
        <div className="hero-bg" style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1541692641319-981cc79ee10a?w=1600&q=70)`,
        }} />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-tag">Discover</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(52px,7vw,90px)' }}>NEW<br />&amp; HOT</h1>
          <p className="hero-desc">What the world is watching — plus what's coming soon.</p>
        </div>
      </section>

      {/* TAB BAR */}
      <div className="tab-bar">
        <button className={`tab${tab === 'watching' ? ' active' : ''}`} onClick={() => setTab('watching')}>
          🔥 Everyone's Watching
        </button>
        <button className={`tab${tab === 'coming' ? ' active' : ''}`} onClick={() => setTab('coming')}>
          📅 Coming Soon
        </button>
        <button className={`tab${tab === 'top10' ? ' active' : ''}`} onClick={() => setTab('top10')}>
          🏆 Top 10 Today
        </button>
      </div>

      {loading && <div style={{ padding: '40px 72px' }}>Loading...</div>}

      {/* EVERYONE'S WATCHING */}
      {!loading && tab === 'watching' && (
        <div className="hot-list reveal">
          {watching.map((item, i) => (
            <div key={item.id} className="hot-item" onClick={() => onSelect(item)}>
              <div className="hot-thumb">
                <img src={item.imgWide || item.img} alt={item.title} />
                <div className="hot-thumb-overlay">
                  <div className="hot-play">▶</div>
                </div>
              </div>
              <div className="hot-info">
                <div className="hot-tag">{item.type === 'series' ? `Series` : `Film`}</div>
                <div className="hot-title">#{i + 1} — {item.title}</div>
                <div className="hot-desc">{item.desc?.slice(0, 160)}...</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMING SOON */}
      {!loading && tab === 'coming' && (
        <div className="hot-list reveal">
          {comingSoon.map(item => (
            <div key={item.id} className="hot-item">
              <div className="hot-thumb">
                <img src={item.imgWide || item.img} alt={item.title} />
              </div>
              <div className="hot-info">
                <div className="hot-date">📅 {item.year}</div>
                <div className="hot-tag">{item.type === 'series' ? 'Series' : 'Film'}</div>
                <div className="hot-title">{item.title}</div>
                <div className="hot-desc">{item.desc}</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button className="btn-info" style={{ fontSize: '9px', padding: '8px 16px' }}>🔔 Remind Me</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOP 10 */}
      {!loading && tab === 'top10' && (
        <div className="reveal">
          <div style={{ padding: '0 72px 20px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
            Updated daily based on viewing hours
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {top10.map((item, i) => (
              <div key={item.id} style={{ position: 'relative' }} onClick={() => onSelect(item)}>
                <div style={{
                  position: 'absolute', top: '-12px', left: '-8px', zIndex: 3,
                  fontFamily: 'var(--display)', fontSize: '72px', color: 'var(--black)',
                  WebkitTextStroke: '2px rgba(255,255,255,.15)', lineHeight: 1, pointerEvents: 'none',
                }}>
                  {i + 1}
                </div>
                <div className="grid-card">
                  <img src={item.img} alt={item.title} />
                  <div className="grid-card-overlay">
                    <div className="grid-card-title">{item.title}</div>
                    <div className="grid-card-meta"><span className="match">{item.match}%</span> · {item.year}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
