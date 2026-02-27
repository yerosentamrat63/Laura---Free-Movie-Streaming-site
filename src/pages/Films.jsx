import { useState, useEffect } from 'react';
import { GridCard } from '../components/Carousel';
import { Carousel } from '../components/Carousel';
import Footer from '../components/Footer';
import { tmdb, mapTMDBToContent, fetchTMDB } from '../lib/tmdb';

const GENRES = ['All', 'Action', 'Comedy', 'Crime', 'Drama', 'Historical', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'War'];
const SORT_OPTIONS = ['Best Match', 'Newest', 'A-Z'];

const TMDB_MOVIE_GENRES = {
  Action: 28, Comedy: 35, Crime: 80, Drama: 18, Historical: 36, Horror: 27, Romance: 10749, 'Sci-Fi': 878, Thriller: 53, War: 10752
};

export default function Films({ onSelect }) {
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState('Best Match');

  const [films, setFilms] = useState([]);
  const [topFilms, setTopFilms] = useState([]);
  const [newFilms, setNewFilms] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [spotlight, setSpotlight] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (genre !== 'All') {
          params.with_genres = TMDB_MOVIE_GENRES[genre];
        }

        if (sort === 'Newest') {
          params.sort_by = 'release_date.desc';
          params['release_date.lte'] = new Date().toISOString().split('T')[0];
        } else if (sort === 'A-Z') {
          params.sort_by = 'title.asc';
        } else {
          params.sort_by = 'popularity.desc';
        }

        const [discoverRes, topRes, newRes] = await Promise.all([
          fetchTMDB('/discover/movie', params),
          tmdb.getTrending('movie', 'week'),
          fetchTMDB('/movie/now_playing', { region: 'US' })
        ]);

        const heroList = topRes.results.map(i => mapTMDBToContent(i, 'movie'));

        setFilms(discoverRes.results.map(i => mapTMDBToContent(i, 'movie')));
        setTopFilms(heroList.slice(0, 10));
        setNewFilms(newRes.results.map(i => mapTMDBToContent(i, 'movie')).slice(0, 10));

        if (!featured) setFeatured(heroList[0]);
        if (spotlight.length === 0) setSpotlight(heroList.slice(1, 4));

      } catch (e) {
        console.error("Failed to fetch films data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [genre, sort]);

  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [films, loading]);

  if (loading && !featured) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div className="page-container">
      {/* HERO */}
      <section className="hero" style={{ height: '70vh' }}>
        <div className="hero-bg" style={{ backgroundImage: `url(${featured?.imgWide || featured?.img})` }} />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-tag">Films</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(52px,7vw,96px)' }}>CINEMA</h1>
          <p className="hero-desc">Award-winning films, indie gems, and blockbusters — all in one place.</p>
          {featured && (
            <>
              <div className="hero-meta">
                <span className="match">{featured.match}% Match</span>
                <span className="dot" />
                <span>{featured.year}</span>
              </div>
              <div className="hero-actions" style={{ marginTop: '8px' }}>
                <button className="btn-play" onClick={() => onSelect(featured)}>▶ Play {featured.title}</button>
                <button className="btn-info" onClick={() => onSelect(featured)}>ⓘ More Info</button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {['Now Playing', 'Top Rated', 'Blockbusters', 'Award Winners', 'Indie Darlings', 'Action Packed', 'Sci-Fi Epics', 'Comedy Gold', 'Thrillers',
            'Now Playing', 'Top Rated', 'Blockbusters', 'Award Winners', 'Indie Darlings', 'Action Packed', 'Sci-Fi Epics', 'Comedy Gold', 'Thrillers'].map((item, i) => (
              <div key={i} className="marquee-item">
                <span className="dot" />
                {i % 8 === 0 ? <strong>{item}</strong> : item}
              </div>
            ))}
        </div>
      </div>

      {/* TOP FILMS */}
      <Carousel title="Top Rated" subtitle="FILMS" items={topFilms} onSelect={onSelect} />

      {/* NEW FILMS */}
      {newFilms.length > 0 && (
        <Carousel title="Newly Added" subtitle="FILMS" items={newFilms} onSelect={onSelect} />
      )}

      {/* FILTERS + FULL GRID */}
      <div style={{ padding: '16px 72px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
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

      <div style={{ padding: '12px 72px 0', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
        {loading ? 'Loading...' : `${films.length} films found`}
      </div>

      <div className="content-grid reveal" style={{ marginTop: '14px' }}>
        {films.map(item => <GridCard key={item.id} item={item} onSelect={onSelect} />)}
      </div>

      {/* FEATURE SPOTLIGHT */}
      {spotlight.length === 3 && (
        <div className="feature-section reveal" style={{ marginTop: '16px' }}>
          <div className="section-header" style={{ padding: 0, marginBottom: '14px' }}>
            <div className="section-title">In The <span>SPOTLIGHT</span></div>
          </div>
          <div className="feature-grid">
            <div className="feature-item" onClick={() => onSelect(spotlight[0])}>
              <img src={spotlight[0].imgWide || spotlight[0].img} alt={spotlight[0].title} />
              <div className="feature-overlay">
                <div className="feature-label">Epic Must Watch</div>
                <div className="feature-name">{spotlight[0].title.toUpperCase()}</div>
                <div className="feature-genre">Featured</div>
              </div>
              <div className="feature-play">▶</div>
            </div>
            <div className="feature-side">
              {spotlight.slice(1).map(f => (
                <div key={f.id} className="feature-item" onClick={() => onSelect(f)}>
                  <img src={f.imgWide || f.img} alt={f.title} />
                  <div className="feature-overlay">
                    <div className="feature-label">Popular Now</div>
                    <div className="feature-name">{f.title.toUpperCase()}</div>
                    <div className="feature-genre">{f.year}</div>
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
