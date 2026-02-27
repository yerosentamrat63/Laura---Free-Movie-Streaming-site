import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export function Carousel({ title, subtitle, items, onSelect, wide, numbered, children }) {
  const ref = useRef(null);
  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * 480, behavior: 'smooth' });

  return (
    <section className="section reveal">
      <div className="section-header">
        <div className="section-title">{title}{subtitle && <span>{subtitle}</span>}</div>
        <a href="#" className="see-all" onClick={e => e.preventDefault()}>See All</a>
      </div>
      <div className="carousel-wrap">
        <button className="carousel-arrow left" onClick={() => scrollBy(-1)}>‹</button>
        <div className="carousel" ref={ref}>
          {children || items?.map((item, i) =>
            numbered
              ? <NumCard key={item.id} item={item} num={i + 1} onSelect={onSelect} />
              : <Card key={item.id} item={item} onSelect={onSelect} wide={wide} />
          )}
        </div>
        <button className="carousel-arrow right" onClick={() => scrollBy(1)}>›</button>
      </div>
    </section>
  );
}

export function Card({ item, onSelect, wide }) {
  const { toggleMyList, isInList } = useAuth();
  return (
    <div className={`card${wide ? ' wide' : ''}`} onClick={() => onSelect(item)}>
      <img src={item.img} alt={item.title} loading="lazy" />
      <div className="card-overlay">
        <div className="card-title">{item.title}</div>
        <div className="card-actions">
          <div className="card-btn play-btn">▶</div>
          <div className="card-btn" onClick={e => { e.stopPropagation(); toggleMyList(item); }}>
            {isInList(item.id) ? '✓' : '+'}
          </div>
          <div className="card-btn">⌄</div>
        </div>
        <div className="card-meta">
          <span className="match">{item.match}%</span>
          {item.type === 'series' ? `${item.seasons}S` : item.duration}
        </div>
      </div>
    </div>
  );
}

export function NumCard({ item, num, onSelect }) {
  return (
    <div className="num-card" onClick={() => onSelect(item)}>
      <span className="num">{num}</span>
      <img src={item.img} alt={item.title} loading="lazy" />
    </div>
  );
}

export function GridCard({ item, onSelect }) {
  const { toggleMyList, isInList } = useAuth();
  return (
    <div className="grid-card" onClick={() => onSelect(item)}>
      <img src={item.img} alt={item.title} loading="lazy" />
      <div className="grid-card-overlay">
        <div className="grid-card-title">{item.title}</div>
        <div className="grid-card-actions">
          <div className="card-btn play-btn">▶</div>
          <div className="card-btn" onClick={e => { e.stopPropagation(); toggleMyList(item); }}>
            {isInList(item.id) ? '✓' : '+'}
          </div>
        </div>
        <div className="grid-card-meta">
          <span className="match">{item.match}%</span>
          {item.year} · {item.genre?.[0]}
        </div>
      </div>
    </div>
  );
}
