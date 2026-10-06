import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb } from '../lib/tmdb';
import { fetchAnimeById } from '../lib/anilist';
import { getProviders } from '../lib/players';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const selectStyle = {
  background: 'var(--gray)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  padding: '8px 12px',
  outline: 'none',
  cursor: 'pointer'
};

const labelStyle = {
  fontFamily: 'var(--mono)',
  fontSize: '9px',
  color: 'var(--text-dim)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

const miniBtnStyle = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'var(--text-dim)',
  padding: '8px 12px',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};

export default function Watch() {
  const { mediaType, tmdbId, episode: routeEpisode, lang: routeLang } = useParams();
  const navigate = useNavigate();
  const { saveToHistory } = useAuth();

  const isAnime = mediaType === 'anime';
  const animeEp = parseInt(routeEpisode, 10) || 1;
  const animeLang = routeLang === 'dub' ? 'dub' : 'sub';

  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [seasonData, setSeasonData] = useState(null);
  const [seasonError, setSeasonError] = useState(false);

  const [providerIndex, setProviderIndex] = useState(0);
  const [frameUrl, setFrameUrl] = useState('');
  const [healthy, setHealthy] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [slow, setSlow] = useState(false);
  const [notice, setNotice] = useState(null);
  const [exhausted, setExhausted] = useState(false);

  const healthyRef = useRef(false);
  const suppressUrl = useRef(false);
  const failoverRef = useRef(() => {});

  const providers = useMemo(
    () => getProviders({ mediaType, tmdbId, season, episode: isAnime ? animeEp : episode, lang: animeLang }),
    [mediaType, tmdbId, season, episode, animeEp, animeLang, isAnime]
  );

  useEffect(() => {
    setProviderIndex(0);
  }, [mediaType, tmdbId]);

  useEffect(() => {
    if (suppressUrl.current) {
      suppressUrl.current = false;
      return;
    }
    const idx = Math.min(providerIndex, providers.length - 1);
    setFrameUrl(providers[idx]?.url || '');
    setExhausted(false);
  }, [providers, providerIndex]);

  const markHealthy = useCallback(() => {
    if (healthyRef.current) return;
    healthyRef.current = true;
    setHealthy(true);
    setSlow(false);
    setOverlay(false);
    setNotice(null);
  }, []);

  const failover = useCallback((reason) => {
    if (providerIndex >= providers.length - 1) {
      setExhausted(true);
      return;
    }
    const current = providers[providerIndex];
    const next = providers[providerIndex + 1];
    setNotice(`${current.label} ${reason} — switched to ${next.label}.`);
    setProviderIndex(providerIndex + 1);
  }, [providers, providerIndex]);

  useEffect(() => {
    failoverRef.current = failover;
  }, [failover]);

  useEffect(() => {
    if (!frameUrl) return undefined;
    healthyRef.current = false;
    setHealthy(false);
    setSlow(false);
    setOverlay(true);
    const overlayTimer = setTimeout(() => setOverlay(false), 4000);
    const slowTimer = setTimeout(() => {
      if (!healthyRef.current) setSlow(true);
    }, 7000);
    const failTimer = setTimeout(() => {
      if (!healthyRef.current) failoverRef.current('did not respond');
    }, 15000);
    return () => {
      clearTimeout(overlayTimer);
      clearTimeout(slowTimer);
      clearTimeout(failTimer);
    };
  }, [frameUrl, reloadKey]);

  useEffect(() => {
    const onMessage = (event) => {
      const provider = providers[providerIndex];
      if (!provider || !provider.origins.includes(event.origin)) return;
      const verdict = provider.probe?.(event.data) ?? null;
      if (verdict === 'fail') {
        failover('reported an error');
        return;
      }
      if (verdict === 'ok') markHealthy();
      const data = event.data;
      if (data?.type === 'cinesrc:nextepisode' && data.internalNavigation) {
        suppressUrl.current = true;
        if (data.season) setSeason(data.season);
        if (data.episode) setEpisode(data.episode);
      }
      if (data?.type === 'cinesrc:close') navigate(-1);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [providers, providerIndex, failover, markHealthy, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDetailsError(false);
    const fetchDetails = async () => {
      try {
        const data = isAnime
          ? await fetchAnimeById(tmdbId)
          : await tmdb.getDetails(mediaType, tmdbId);
        if (cancelled) return;
        setDetails(data);
        if (mediaType === 'tv' && data.seasons?.length > 0) {
          const cleanSeasons = data.seasons.filter(s => s.season_number > 0);
          const defaultSeason = cleanSeasons.length > 0 ? cleanSeasons[0].season_number : 1;
          setSeason(defaultSeason);
        }
      } catch (error) {
        if (!cancelled) setDetailsError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetails();
    return () => { cancelled = true; };
  }, [mediaType, tmdbId, isAnime, reloadKey]);

  useEffect(() => {
    if (mediaType !== 'tv' || season <= 0) return;
    let cancelled = false;
    setSeasonError(false);
    const fetchSeason = async () => {
      try {
        const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=${TMDB_API_KEY}`);
        if (!res.ok) throw new Error(`Season fetch failed: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setSeasonData(data);
        if (data.episodes && !data.episodes.some(e => e.episode_number === episode)) {
          setEpisode(1);
        }
      } catch (e) {
        if (!cancelled) setSeasonError(true);
      }
    };
    fetchSeason();
    return () => { cancelled = true; };
  }, [mediaType, tmdbId, season, episode]);

  useEffect(() => {
    if (!details) return;
    if (isAnime) {
      saveToHistory({ id: tmdbId, type: 'anime' }, null, animeEp);
    } else if (mediaType === 'movie') {
      saveToHistory({ id: tmdbId, type: 'movie' }, null, null);
    } else {
      saveToHistory({ id: tmdbId, type: 'tv' }, season, episode);
    }
  }, [details, mediaType, isAnime, tmdbId, season, episode, animeEp]);

  const retryChain = () => {
    setProviderIndex(0);
    setNotice(null);
    setExhausted(false);
    setReloadKey(k => k + 1);
  };

  const hardReload = () => {
    setDetails(null);
    setSeasonData(null);
    setLoading(true);
    setProviderIndex(0);
    setNotice(null);
    setExhausted(false);
    setReloadKey(k => k + 1);
  };

  const switchProvider = (index) => {
    if (index === providerIndex) return;
    setNotice(null);
    setProviderIndex(index);
  };

  const gotoAnime = (ep, lang) => {
    navigate(`/watch/anime/${tmdbId}/${ep}/${lang}`, { replace: true });
  };

  const handleFrameLoad = () => {
    if (!providers[providerIndex]?.requiresMessage) markHealthy();
  };

  const activeProvider = providers[Math.min(providerIndex, providers.length - 1)];

  if (loading) {
    return (
      <div className="player-loading" style={{ minHeight: '100vh' }}>
        <div className="player-loading-text">LOADING PLAYER</div>
        <div className="player-loading-bar"><span /></div>
      </div>
    );
  }

  if (detailsError || !details) {
    return (
      <div className="player-loading" style={{ minHeight: '100vh' }}>
        <div className="player-loading-text">PLAYER UNAVAILABLE</div>
        <div className="player-loading-sub">Metadata could not be loaded. Check your connection.</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="player-retry-btn" onClick={hardReload}>Retry</button>
          <button className="player-retry-btn ghost" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  const chipText = notice || (slow && !healthy
    ? `${activeProvider?.label || 'Player'} is slow to respond — a backup takes over automatically if it stays stuck.`
    : null);

  return (
    <>
      <Navbar />
      <div className="watch-container" style={{ paddingTop: '80px', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>

        <div className="player-wrapper" style={{ flex: 1, position: 'relative', width: '100%', backgroundColor: '#000' }}>
          {frameUrl && !exhausted && (
            <iframe
              key={`${providerIndex}-${reloadKey}`}
              src={frameUrl}
              title="Player"
              frameBorder="0"
              allowFullScreen
              allow={activeProvider?.allow}
              scrolling={activeProvider?.scrolling}
              onLoad={handleFrameLoad}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
            />
          )}

          {!healthy && !exhausted && overlay && (
            <div className="player-loading" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <div className="player-loading-text">LOADING STREAM</div>
              <div className="player-loading-bar"><span /></div>
            </div>
          )}

          {chipText && !exhausted && (
            <div className="player-slow-bar">
              {chipText}
              {notice && (
                <button
                  onClick={() => setNotice(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {exhausted && (
            <div className="player-loading" style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
              <div className="player-loading-text">PLAYER UNAVAILABLE</div>
              <div className="player-loading-sub">Every player failed for this title. Check your connection or ad blocker, then retry.</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="player-retry-btn" onClick={retryChain}>Retry</button>
                <button className="player-retry-btn ghost" onClick={() => navigate(-1)}>Go back</button>
              </div>
            </div>
          )}
        </div>

        <div className="watch-info" style={{ padding: '24px 72px', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <button
                onClick={() => navigate(-1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', marginBottom: '16px' }}
              >
                ← Back
              </button>
              <h1 style={{ fontFamily: 'var(--display)', fontSize: '32px', marginBottom: '8px' }}>
                {details.title || details.name}
              </h1>
              {mediaType === 'tv' && (
                <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '12px' }}>
                  Season {season} · Episode {episode}
                  {seasonData?.episodes?.find(e => e.episode_number === episode)?.name &&
                    ` - ${seasonData.episodes.find(e => e.episode_number === episode).name}`}
                  {seasonError && ' · episode list unavailable'}
                </div>
              )}
              {isAnime && (
                <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '12px' }}>
                  Episode {animeEp} · {animeLang.toUpperCase()}
                  {details.episodes ? ` · ${details.episodes} episodes` : ''}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {mediaType === 'tv' && (
                <>
                  <div>
                    <div style={labelStyle}>Season</div>
                    <select
                      value={season}
                      onChange={(e) => setSeason(parseInt(e.target.value))}
                      style={selectStyle}
                    >
                      {details.seasons?.filter(s => s.season_number > 0).map(s => (
                        <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={labelStyle}>Episode</div>
                    <select
                      value={episode}
                      disabled={!seasonData?.episodes}
                      onChange={(e) => setEpisode(parseInt(e.target.value))}
                      style={selectStyle}
                    >
                      {seasonData?.episodes
                        ? seasonData.episodes.map(e => (
                            <option key={e.episode_number} value={e.episode_number}>Ep {e.episode_number}</option>
                          ))
                        : <option value={episode}>—</option>}
                    </select>
                  </div>
                </>
              )}

              {isAnime && (
                <>
                  <div>
                    <div style={labelStyle}>Episode</div>
                    {details.episodes > 0 ? (
                      <select
                        value={animeEp}
                        onChange={(e) => gotoAnime(parseInt(e.target.value), animeLang)}
                        style={selectStyle}
                      >
                        {Array.from({ length: details.episodes }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>Ep {n}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        value={animeEp}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (n >= 1) gotoAnime(n, animeLang);
                        }}
                        style={{ ...selectStyle, width: '84px' }}
                      />
                    )}
                  </div>

                  <div>
                    <div style={labelStyle}>Audio</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['sub', 'dub'].map(l => (
                        <button
                          key={l}
                          onClick={() => gotoAnime(animeEp, l)}
                          style={{
                            ...miniBtnStyle,
                            borderColor: animeLang === l ? 'var(--red)' : undefined,
                            color: animeLang === l ? 'var(--white)' : undefined
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <div style={labelStyle}>Source</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {providers.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => switchProvider(i)}
                      style={{
                        ...miniBtnStyle,
                        borderColor: i === providerIndex ? 'var(--red)' : undefined,
                        color: i === providerIndex ? 'var(--white)' : undefined
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Player</div>
                <button onClick={hardReload} style={miniBtnStyle}>Reload</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
