import { useState, useEffect, useRef } from 'react';
import { tmdb, mapTMDBToContent } from '../lib/tmdb';

export default function SearchOverlay({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await tmdb.search(query);
        // Filter out people, keep only movies/tv
        const filtered = res.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
        setResults(filtered.map(item => mapTMDBToContent(item)).slice(0, 8));
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className={`search-overlay${open ? ' open' : ''}`}>
      <div className="search-input-wrap">
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search titles, actors, genres..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="search-close" onClick={onClose}>✕</button>
      </div>
      {results.length > 0 ? (
        <div className="search-results">
          {results.map(item => (
            <div
              key={item.id}
              className="search-result-item"
              style={{ cursor: 'none' }}
              onClick={() => { onSelect(item); onClose(); }}
            >
              <img src={item.imgWide || item.img || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&q=80'} alt={item.title} />
              <span className="search-result-title">{item.title}</span>
              <span className="search-result-type">{item.type}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="search-hint">
          {loading ? 'Searching...' : query.length > 1 ? 'No results found' : 'Start typing to discover'}
        </div>
      )}
    </div>
  );
}
