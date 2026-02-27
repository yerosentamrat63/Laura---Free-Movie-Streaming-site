import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Modal({ item, onClose }) {
  const { toggleMyList, isInList } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  const inList = isInList(item.id);

  const handlePlay = () => {
    const mediaType = item.type === 'series' ? 'tv' : 'movie';
    navigate(`/watch/${mediaType}/${item.id}`);
    onClose();
  };

  return (
    <div className={`modal-overlay open`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hero">
          <img src={item.imgWide || item.img} alt={item.title} />
          <div className="modal-hero-grad" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-title">{item.title}</div>
          <div className="modal-meta">
            <span className="match">{item.match || 0}% Match</span>
            <span>{item.year || ''}</span>
            <span>{item.type === 'series' ? (item.seasons ? `${item.seasons} Season${item.seasons > 1 ? 's' : ''}` : 'Series') : (item.duration || 'Film')}</span>
          </div>
          <p className="modal-desc">{item.desc}</p>
          <div className="modal-actions">
            <button className="btn-play" onClick={handlePlay}>▶ Play</button>
            <button
              className={`modal-list-btn${inList ? ' in-list' : ''}`}
              onClick={() => toggleMyList(item)}
            >
              {inList ? '✓ In My List' : '+ My List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
