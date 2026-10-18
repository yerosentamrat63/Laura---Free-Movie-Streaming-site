import { useEffect, useRef, useState } from 'react';

export default function Loader() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [hidden, setHidden] = useState(prefersReducedMotion);
  const videoRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timeout = window.setTimeout(() => setHidden(true), 18000);
    videoRef.current?.play().catch(() => setHidden(true));

    return () => window.clearTimeout(timeout);
  }, [prefersReducedMotion]);

  const finishIntro = () => {
    videoRef.current?.pause();
    setHidden(true);
  };

  return (
    <div className={`loader${hidden ? ' hidden' : ''}`} aria-hidden={hidden}>
      <video
        ref={videoRef}
        className="loader-video"
        src="/laura-intro.mp4"
        poster="/laura-intro-poster.jpg"
        muted
        playsInline
        preload="auto"
        onEnded={finishIntro}
        onError={finishIntro}
        aria-hidden="true"
      />
      <button className="loader-skip" type="button" onClick={finishIntro}>Skip intro</button>
    </div>
  );
}
