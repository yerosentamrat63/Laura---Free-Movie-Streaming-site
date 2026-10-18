import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb } from '../lib/tmdb';
import { fetchAnimeById } from '../lib/anilist';
import { getProviders } from '../lib/players';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

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
  const [openPicker, setOpenPicker] = useState(null);

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
  const pickerRef = useRef(null);

  useEffect(() => {
    const closePicker = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && pickerRef.current?.contains(event.target)) return;
      setOpenPicker(null);
    };
    document.addEventListener('pointerdown', closePicker);
    document.addEventListener('keydown', closePicker);
    return () => {
      document.removeEventListener('pointerdown', closePicker);
      document.removeEventListener('keydown', closePicker);
    };
  }, []);

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
    setFrameUrl(providers[idx]?.url || '');``
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
        <div className="player-loading-text">Loading Player</div>
        <div className="player-loading-bar"><span /></div>
      </div>
    );
  }

  if (detailsError || !details) {
    return (
      <div className="player-loading" style={{ minHeight: '100vh' }}>
        <div className="player-loading-text">Player Unavailable</div>
        <div className="player-loading-sub">Details are unavailable. Check your connection.</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="player-retry-btn" onClick={hardReload}>Retry</button>
          <button className="player-retry-btn ghost" onClick={() => navigate(-1)}>Back</button>
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
      <div className="watch-container">

        <div className="player-wrapper">
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
              <div className="player-loading-text">Loading Stream</div>
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
              <div className="player-loading-text">Player Unavailable</div>
              <div className="player-loading-sub">No player responded. Check your connection and retry.</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="player-retry-btn" onClick={retryChain}>Retry</button>
                <button className="player-retry-btn ghost" onClick={() => navigate(-1)}>Back</button>
              </div>
            </div>
          )}
        </div>

        <div className="watch-info">
          <div className="watch-info-top">
            <div className="watch-info-head">
              <button className="watch-back" onClick={() => navigate(-1)}>← Back</button>
              <h1 className="watch-title">{details.title || details.name}</h1>
              {mediaType === 'tv' && (
                <div className="watch-meta">
                  Season {season} · Episode {episode}
                  {seasonData?.episodes?.find(e => e.episode_number === episode)?.name &&
                    ` — ${seasonData.episodes.find(e => e.episode_number === episode).name}`}
                  {seasonError && ' · episode list unavailable'}
                </div>
              )}
              {isAnime && (
                <div className="watch-meta">
                  Episode {animeEp} · {animeLang}
                  {details.episodes ? ` · ${details.episodes} episodes` : ''}
                </div>
              )}
            </div>

            <div className="watch-controls">
              {mediaType === 'tv' && (
                <div className="watch-tv-selectors" ref={pickerRef}>
                  <div className="watch-field watch-picker">
                    <div className="watch-field-label">Season</div>
                    <button
                      type="button"
                      className="watch-select watch-picker-trigger"
                      aria-expanded={openPicker === 'season'}
                      onClick={() => setOpenPicker(openPicker === 'season' ? null : 'season')}
                    >
                      Season {season}<span className="watch-picker-chevron" aria-hidden="true">⌄</span>
                    </button>
                    {openPicker === 'season' && (
                      <div className="watch-picker-popover watch-season-popover" role="group" aria-label="Choose season">
                        {details.seasons?.filter(item => item.season_number > 0).map(item => (
                          <button
                            key={item.season_number}
                            type="button"
                            className={`watch-picker-cell${item.season_number === season ? ' active' : ''}`}
                            aria-pressed={item.season_number === season}
                            onClick={() => {
                              setSeason(item.season_number);
                              setOpenPicker(null);
                            }}
                          >
                            {item.season_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="watch-field watch-picker">
                    <div className="watch-field-label">Episode</div>
                    <button
                      type="button"
                      className="watch-select watch-picker-trigger"
                      aria-expanded={openPicker === 'episode'}
                      disabled={!seasonData?.episodes?.length}
                      onClick={() => setOpenPicker(openPicker === 'episode' ? null : 'episode')}
                    >
                      Episode {episode}<span className="watch-picker-chevron" aria-hidden="true">⌄</span>
                    </button>
                    {openPicker === 'episode' && seasonData?.episodes?.length > 0 && (
                      <div className="watch-picker-popover watch-episode-popover" role="group" aria-label={`Choose an episode from season ${season}`}>
                        {seasonData.episodes.map(item => (
                          <button
                            key={item.episode_number}
                            type="button"
                            className={`watch-picker-cell${item.episode_number === episode ? ' active' : ''}`}
                            aria-label={`Episode ${item.episode_number}: ${item.name || 'Untitled episode'}`}
                            aria-pressed={item.episode_number === episode}
                            title={item.name || `Episode ${item.episode_number}`}
                            onClick={() => {
                              setEpisode(item.episode_number);
                              setOpenPicker(null);
                            }}
                          >
                            {item.episode_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {seasonError && <span className="watch-picker-error">Episode list unavailable</span>}
                </div>
              )}

              {isAnime && (
                <>
                  <div className="watch-field">
                    <div className="watch-field-label">Episode</div>
                    {details.episodes > 0 ? (
                      <select
                        className="watch-select"
                        value={animeEp}
                        onChange={(e) => gotoAnime(parseInt(e.target.value), animeLang)}
                      >
                        {Array.from({ length: details.episodes }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>Ep {n}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        className="watch-select watch-num-input"
                        value={animeEp}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (n >= 1) gotoAnime(n, animeLang);
                        }}
                      />
                    )}
                  </div>

                  <div className="watch-field">
                    <div className="watch-field-label">Audio</div>
                    <div className="watch-btn-row">
                      {['sub', 'dub'].map(l => (
                        <button
                          key={l}
                          onClick={() => gotoAnime(animeEp, l)}
                          className={`watch-mini-btn${animeLang === l ? ' active' : ''}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="watch-field watch-field--wide">
                <div className="watch-field-label">Source</div>
                <div className="watch-btn-row">
                  {providers.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => switchProvider(i)}
                      className={`watch-mini-btn${i === providerIndex ? ' active' : ''}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
