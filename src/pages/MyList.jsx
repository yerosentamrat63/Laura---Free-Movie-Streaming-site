import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GridCard } from '../components/Carousel';
import Footer from '../components/Footer';
import { tmdb, mapTMDBToContent } from '../lib/tmdb';

export default function MyList({ onSelect }) {
  const { myList, user } = useAuth();
  const [listDetails, setListDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!myList || myList.length === 0) {
        setListDetails([]);
        return;
      }
      setLoading(true);
      try {
        const detailsPromises = myList.map(async (item) => {
          // tmdb endpoints expect 'movie' or 'tv'
          const mediaType = item.type === 'series' ? 'tv' : 'movie';
          const details = await tmdb.getDetails(mediaType, item.id);
          return mapTMDBToContent(details, mediaType);
        });
        const fullDetails = await Promise.all(detailsPromises);
        setListDetails(fullDetails);
      } catch (e) {
        console.error("Failed to fetch my list details", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [myList]);

  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [listDetails, loading]);

  return (
    <div className="page-container">
      {/* PAGE HERO */}
      <div style={{ paddingTop: '120px', paddingBottom: '48px', paddingLeft: '72px', paddingRight: '72px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '10px' }}>
          {user?.user_metadata?.name || user?.email}'s
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(52px,7vw,90px)', lineHeight: '.92', marginBottom: '14px' }}>MY LIST</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {myList.length} {myList.length === 1 ? 'title' : 'titles'} saved
        </p>
      </div>

      {myList.length === 0 ? (
        <div className="empty-list">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Nothing here yet</div>
          <div className="empty-sub">Browse content and hit + to add titles to your list</div>
        </div>
      ) : (
        <>
          {/* SORT BAR */}
          <div style={{ padding: '24px 72px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Sort by:</span>
            {['Date Added', 'A-Z', 'Type'].map(opt => (
              <button key={opt} style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', padding: '6px 14px', background: 'none', border: '1px solid rgba(255,255,255,.1)', color: 'var(--text-dim)', cursor: 'none' }}>
                {opt}
              </button>
            ))}
          </div>

          <div className="content-grid reveal" style={{ marginTop: '20px' }}>
            {loading ? <div style={{ padding: '20px 72px' }}>Loading list details...</div> : listDetails.map(item => <GridCard key={item.id} item={item} onSelect={onSelect} />)}
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
