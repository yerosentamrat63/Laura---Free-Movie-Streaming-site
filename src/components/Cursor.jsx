import { useEffect, useRef, useState } from 'react';

const finePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function Cursor() {
  const cursorRef = useRef(null);
  const [enabled, setEnabled] = useState(finePointer);

  useEffect(() => {
    const onTouch = () => setEnabled(false);
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);

  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.remove('no-custom-cursor');
      return undefined;
    }
    document.documentElement.classList.add('no-custom-cursor');
    return () => document.documentElement.classList.remove('no-custom-cursor');
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const cursor = cursorRef.current;
    if (!cursor) return undefined;

    const onMove = (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    };
    const onDown = () => cursor.classList.add('clicked');
    const onUp   = () => cursor.classList.remove('clicked');

    const onEnter = () => cursor.classList.add('hovered');
    const onLeave = () => cursor.classList.remove('hovered');

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup',   onUp);

    const addListeners = () => {
      document.querySelectorAll('a, button, .card, .num-card, .feature-item, .genre-card, .avatar, .carousel-arrow, .grid-card, .hot-item, .hot-play')
        .forEach(el => {
          el.addEventListener('mouseenter', onEnter);
          el.addEventListener('mouseleave', onLeave);
        });
    };

    addListeners();
    const mo = new MutationObserver(addListeners);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup',   onUp);
      mo.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div id="cursor" ref={cursorRef} />;
}
