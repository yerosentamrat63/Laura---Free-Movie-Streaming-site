import { useState, useEffect } from 'react';
import { GridCard } from '../components/Carousel';
import Footer from '../components/Footer';
import { tmdb, mapTMDBToContent, fetchTMDB } from '../lib/tmdb';

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Mystery', 'Sci-Fi', 'Documentary', 'Animation', 'Reality'];
const SORT_OPTIONS = ['Best Match', 'Newest', 'A-Z'];

const TMDB_TV_GENRES = {
  Action: 10759, Comedy: 35, Drama: 18, Mystery: 96, 'Sci-Fi': 10765, Documentary: 99, Animation: 16, Reality: 10764
};

export default function Series({ onSelect }) {
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState('Best Match');
  const [shows, setShows] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [spotlight, setSpotlight] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      try {
        const params = {};
        if (genre !== 'All') {
          params.with_genres = TMDB_TV_GENRES[genre];
        }

        if (sort === 'Newest') {
          params.sort_by = 'first_air_date.desc';
        } else if (sort === 'A-Z') {
          params.sort_by = 'name.asc';
        } else {
          params.sort_by = 'popularity.desc';
        }

        const [discoverRes, trendingRes] = await Promise.all([
          fetchTMDB('/discover/tv', params),
          tmdb.getTrending('tv', 'week')
        ]);

        setShows(discoverRes.results.map(i => mapTMDBToContent(i, 'tv')));

        const trendingItems = trendingRes.results.map(i => mapTMDBToContent(i, 'tv'));
        if (!featured) setFeatured(trendingItems[0]);
        if (spotlight.length === 0) setSpotlight(trendingItems.slice(1, 4));

      } catch (e) {
        console.error("Failed to load TV Shows", e);
      } finally {
        setLoading(false);
      }
    };
    fetchShows();
  }, [genre, sort]);

  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [shows, loading]);

  if (loading && !featured) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div className="page-container">
      {/* HERO */}
      <section className="hero" style={{ height: '65vh' }}>
        <div className="hero-bg" style={{ backgroundImage: `url(${featured?.imgWide || featured?.img})` }} />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-tag">Series</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(52px,7vw,96px)' }}>TV SERIES</h1>
          <p className="hero-desc">The finest long-form storytelling. Binge-worthy, critically acclaimed, unforgettable.</p>
          {featured && (
            <div className="hero-actions" style={{ marginTop: '28px' }}>
              <button className="btn-play" onClick={() => onSelect(featured)}>▶ Play {featured.title}</button>
              <button className="btn-info" onClick={() => onSelect(featured)}>ⓘ More Info</button>
            </div>
          )}
        </div>
      </section>

      {/* FILTERS */}
      <div style={{ padding: '32px 72px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div className="filter-bar" style={{ padding: 0 }}>
          {GENRES.map(g => (
            <button key={g} className={`filter-tab${genre === g ? ' active' : ''}`} onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
        <select
          value={sort} onChange={e => setSort(e.target.value)}
          style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', padding: '8px 14px', background: 'var(--gray)', border: '1px solid rgba(255,255,255,.1)', color: 'var(--text-dim)', cursor: 'none' }}
        >
          {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* FEATURED ROW — dramatic presentation */}
      <div style={{ padding: '28px 72px 0' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '12px' }}>
          {loading ? 'Loading...' : `Showing ${shows.length} series${genre !== 'All' ? ` in ${genre}` : ''}`}
        </div>
      </div>

      {/* GRID */}
      <div className="content-grid reveal" style={{ marginTop: '16px' }}>
        {shows.map(item => <GridCard key={item.id} item={item} onSelect={onSelect} />)}
      </div>

      {/* SPOTLIGHT */}
      {spotlight.length === 3 && (
        <div className="feature-section reveal" style={{ marginTop: '0' }}>
          <div className="section-header" style={{ padding: 0, marginBottom: '14px' }}>
            <div className="section-title">Critically <span>ACCLAIMED</span></div>
          </div>
          <div className="feature-grid">
            <div className="feature-item" onClick={() => onSelect(spotlight[0])}>
              <img src={spotlight[0].imgWide || spotlight[0].img} alt={spotlight[0].title} />
              <div className="feature-overlay">
                <div className="feature-label">Must Watch</div>
                <div className="feature-name">{spotlight[0].title.toUpperCase()}</div>
                <div className="feature-genre">Critically Acclaimed</div>
              </div>
              <div className="feature-play">▶</div>
            </div>
            <div className="feature-side">
              {spotlight.slice(1).map(s => (
                <div key={s.id} className="feature-item" onClick={() => onSelect(s)}>
                  <img src={s.imgWide || s.img} alt={s.title} />
                  <div className="feature-overlay">
                    <div className="feature-label">Popular Series</div>
                    <div className="feature-name">{s.title.toUpperCase()}</div>
                    <div className="feature-genre">{s.year}</div>
                  </div>
                  <div className="feature-play">▶</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
