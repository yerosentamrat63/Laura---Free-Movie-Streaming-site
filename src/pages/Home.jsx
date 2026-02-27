import { useEffect, useState } from 'react';
import { Carousel, Card, NumCard } from '../components/Carousel';
import Footer from '../components/Footer';
import { tmdb, mapTMDBToContent } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';

const MARQUEE_ITEMS = ['Trending Now', 'Dark Matter', 'The Bear', 'Severance', 'Shogun', 'House of the Dragon', 'New Releases', 'Fallout', 'Succession', 'Andor', 'Silo', 'The Boys'];

export default function Home({ onSelect }) {
  const [featuredShow, setFeaturedShow] = useState(null);
  const [trending, setTrending] = useState([]);
  const [top10, setTop10] = useState([]);
  const [featureGrid, setFeatureGrid] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  const { watchHistory, user } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);

  // Initial Data Fetch
  useEffect(() => {
    const loadContent = async () => {
      try {
        const [trendingRes, top10Res, tvRes] = await Promise.all([
          tmdb.getTrending('all', 'day'),
          tmdb.getTrending('movie', 'week'),
          tmdb.getNetflixOriginals()
        ]);

        const trendingItems = trendingRes.results.map(i => mapTMDBToContent(i));
        const top10Items = top10Res.results.map(i => mapTMDBToContent(i, 'movie')).slice(0, 10);
        const tvItems = tvRes.results.map(i => mapTMDBToContent(i, 'tv'));

        setFeaturedShow(trendingItems[0]);
        setTrending(trendingItems.slice(1, 15));
        setTop10(top10Items);

        setFeatureGrid([
          { ...tvItems[0], label: 'Drama · Series', tags: 'Popular · Must Watch' },
          { ...trendingItems[1], label: 'Trending', tags: 'Hot · Global' },
          { ...top10Items[0], label: 'Top Rated', tags: 'Acclaimed · Masterpiece' }
        ]);

        setNewReleases(tvItems.slice(3, 15));
      } catch (e) {
        console.error("Failed to fetch TMDB data", e);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  // Fetch Watch History Details
  useEffect(() => {
    const fetchHistoryDetails = async () => {
      if (!watchHistory || watchHistory.length === 0) {
        setHistoryItems([]);
        return;
      }
      try {
        const promises = watchHistory.map(async (item) => {
          const details = await tmdb.getDetails(item.type, item.id);
          const mapped = mapTMDBToContent(details, item.type);
          if (item.type === 'tv' && item.season && item.episode) {
            mapped.desc = `Resume S${item.season} E${item.episode}`;
            mapped.match = 'Resume';
          }
          return mapped;
        });
        const results = await Promise.all(promises);
        setHistoryItems(results);
      } catch (e) {
        console.error("Failed to fetch history details", e);
      }
    };
    fetchHistoryDetails();
  }, [watchHistory]);

  // Intersection observer for .reveal elements
  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [loading, historyItems]);

  if (loading || !featuredShow) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${featuredShow.imgWide || featuredShow.img})` }} />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-tag">Featured Today</div>
          <h1 className="hero-title">{featuredShow.title}</h1>
          <p className="hero-desc">{featuredShow.desc}</p>
          <div className="hero-meta">
            <span className="match">{featuredShow.match}% Match</span>
            <span className="dot" />
            <span>{featuredShow.year}</span>
            <span className="dot" />
            <span>{featuredShow.type === 'series' ? 'TV Series' : 'Film'}</span>
          </div>
          <div className="hero-actions">
            <button className="btn-play" onClick={() => onSelect(featuredShow)}>▶ Play</button>
            <button className="btn-info" onClick={() => onSelect(featuredShow)}>ⓘ More Info</button>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="marquee-item">
              <span className="dot" />
              {i % 7 === 0 ? <strong>{item}</strong> : item}
            </div>
          ))}
        </div>
      </div>

      {/* CONTINUE WATCHING */}
      {historyItems.length > 0 && (
        <Carousel title="Continue Watching" subtitle={user?.user_metadata?.name?.toUpperCase() || "YOUR HISTORY"} items={historyItems} onSelect={onSelect} />
      )}

      {/* TOP 10 */}
      <Carousel title="Top 10" subtitle="THIS WEEK" items={top10} onSelect={onSelect} numbered />

      {/* EDITOR'S PICKS FEATURE GRID */}
      {featureGrid.length === 3 && (
        <div className="feature-section reveal">
          <div className="section-header" style={{ padding: 0, marginBottom: '14px' }}>
            <div className="section-title">Editor's <span>PICKS</span></div>
          </div>
          <div className="feature-grid">
            <div className="feature-item" onClick={() => onSelect(featureGrid[0])}>
              <img src={featureGrid[0].imgWide || featureGrid[0].img} alt={featureGrid[0].title} />
              <div className="feature-overlay">
                <div className="feature-label">{featureGrid[0].label}</div>
                <div className="feature-name">{featureGrid[0].title}</div>
                <div className="feature-genre">{featureGrid[0].tags}</div>
              </div>
              <div className="feature-play">▶</div>
            </div>
            <div className="feature-side">
              {featureGrid.slice(1).map(item => (
                <div key={item.id} className="feature-item" onClick={() => onSelect(item)}>
                  <img src={item.imgWide || item.img} alt={item.title} />
                  <div className="feature-overlay">
                    <div className="feature-label">{item.label}</div>
                    <div className="feature-name">{item.title}</div>
                    <div className="feature-genre">{item.tags}</div>
                  </div>
                  <div className="feature-play">▶</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRENDING NOW */}
      <Carousel title="Trending" subtitle="NOW" items={trending} onSelect={onSelect} />

      {/* CATEGORIES */}
      <div className="categories reveal">
        <div className="categories-heading">Browse by genre</div>
        <div className="genre-grid">
          {['Action', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Historical', 'War', 'Documentary', 'Animation'].map(genre => (
            <div key={genre} className="genre-card">
              <img src={`https://images.unsplash.com/photo-${genrePhoto(genre)}?w=300&q=70`} alt={genre} />
              <span>{genre}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NEW THIS MONTH */}
      <Carousel title="New Releases" subtitle="SHOWS" items={newReleases} onSelect={onSelect} />

      <Footer />
    </>
  );
}

const genrePhotos = {
  Action: '1553481187-be93c21490a9', Comedy: '1590846406792-0adc7f938f1d', Crime: '1535957998253-26ae1ef29506',
  Drama: '1574267432553-4b4628081c31', Fantasy: '1518173946687-a4c8892bbd9f', Horror: '1469474968028-56623f02e42e',
  Mystery: '1519074069444-1ba4fff66d16', Romance: '1500462918059-b1a0cb512f1d', 'Sci-Fi': '1614729939124-032f0b56c9ce',
  Thriller: '1518676590629-3dcbd9c5a5c9', Historical: '1528360983277-13d401cdc186', War: '1541692641319-981cc79ee10a',
  Documentary: '1543286386-713bdd548da4', Animation: '1522202176988-66273c2fd55f',
};
const genrePhoto = (g) => genrePhotos[g] || '1574267432553-4b4628081c31';
