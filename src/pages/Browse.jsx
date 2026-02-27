import { useState, useEffect } from 'react';
import { GridCard } from '../components/Carousel';
import Footer from '../components/Footer';
import { tmdb, mapTMDBToContent } from '../lib/tmdb';

const TMDB_GENRES = {
  Action: 28, Comedy: 35, Crime: 80, Drama: 18, Fantasy: 14, Horror: 27, Mystery: 96, Romance: 10749, 'Sci-Fi': 878, Thriller: 53, Historical: 36, War: 10752, Documentary: 99, Animation: 16
};

const GENRES = ['Action', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War'];

const GENRE_IMAGES = {
  Action: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&q=80',
  Animation: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&q=80',
  Comedy: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&q=80',
  Crime: 'https://images.unsplash.com/photo-1535957998253-26ae1ef29506?w=400&q=80',
  Documentary: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&q=80',
  Drama: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&q=80',
  Fantasy: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&q=80',
  Historical: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80',
  Horror: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
  Mystery: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=400&q=80',
  Romance: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400&q=80',
  'Sci-Fi': 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=400&q=80',
  Thriller: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80',
  War: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&q=80',
};


export default function Browse({ onSelect }) {
  const [activeGenre, setActiveGenre] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGenre = async () => {
      if (!activeGenre) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const genreId = TMDB_GENRES[activeGenre];
        const [moviesRes, tvRes] = await Promise.all([
          tmdb.getMoviesByGenre(genreId),
          tmdb.getTvShowsByGenre(genreId)
        ]);

        const combined = [
          ...moviesRes.results.map(i => mapTMDBToContent(i, 'movie')),
          ...tvRes.results.map(i => mapTMDBToContent(i, 'tv'))
        ].sort((a, b) => b.match - a.match); // sort by rating roughly

        setItems(combined);
      } catch (e) {
        console.error("Failed to fetch genre", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGenre();
  }, [activeGenre]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [items, activeGenre]);

  return (
    <div className="page-container">
      {/* HEADER */}
      <div style={{ paddingTop: '110px', paddingBottom: '48px', paddingLeft: '72px', paddingRight: '72px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '10px' }}>Explore</div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(52px,7vw,90px)', lineHeight: '.92', marginBottom: '14px' }}>BROWSE</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Browse by genre, mood, or just explore
        </p>
      </div>

      {!activeGenre ? (
        <>
          {/* GENRE GRID */}
          <div style={{ padding: '40px 72px 16px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
            Select a genre
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px', padding: '0 72px 72px' }} className="reveal">
            {GENRES.map(genre => (
              <div
                key={genre}
                onClick={() => setActiveGenre(genre)}
                style={{
                  position: 'relative', height: '130px', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.06)', cursor: 'none',
                  transition: 'transform .3s, border-color .3s',
                }}
                className="genre-card"
              >
                <img
                  src={GENRE_IMAGES[genre]}
                  alt={genre}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.3)', transition: 'transform .5s, filter .3s' }}
                />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-start', justifyContent: 'flex-end', padding: '16px',
                }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '28px', position: 'relative', zIndex: 1 }}>{genre}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '2px', color: 'var(--text-dim)', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
                    1000+ titles
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* GENRE HEADER */}
          <div style={{ padding: '32px 72px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>Genre</div>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: '52px' }}>{activeGenre}</h2>
            </div>
            <button
              onClick={() => setActiveGenre(null)}
              style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', padding: '10px 20px', background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'var(--white)', cursor: 'none', transition: 'border-color .2s' }}
            >
              ← All Genres
            </button>
          </div>

          {/* OTHER GENRES */}
          <div style={{ padding: '20px 72px 0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {GENRES.filter(g => g !== activeGenre).slice(0, 8).map(g => (
              <button
                key={g}
                className="filter-tab"
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 72px 0', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
            {loading ? 'Loading...' : `${items.length} top results`}
          </div>

          <div className="content-grid reveal" style={{ marginTop: '14px' }}>
            {items.map(item => <GridCard key={item.id} item={item} onSelect={onSelect} />)}
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
