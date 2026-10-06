import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Modal({ item, onClose }) {
  const { toggleMyList, isInList } = useAuth();
  const navigate = useNavigate();
  const modalRef = useRef(null);

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

  useEffect(() => {
    if (!item) return;
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [item]);

  if (!item) return null;

  const inList = isInList(item.id);

  const handlePlay = () => {
    navigate(`/watch/${item.type}/${item.id}`);
    onClose();
  };

  return (
    <div className={`modal-overlay open`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={modalRef}>
        <div className="modal-hero">
          <img src={item.imgWide || item.img} alt={item.title} />
          <div className="modal-hero-grad" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-title">{item.title}</div>
          <div className="modal-meta">
            <span className="match">{item.match || 0}/100 Rating</span>
            <span>{item.year || ''}</span>
            <span>{item.type === 'tv' ? (item.seasons ? `${item.seasons} Season${item.seasons > 1 ? 's' : ''}` : 'Series') : (item.duration || 'Film')}</span>
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
