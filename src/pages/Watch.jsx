import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb } from '../lib/tmdb';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Watch() {
    const { mediaType, tmdbId } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [loading, setLoading] = useState(true);

    // For TV Shows: fetch season details
    const [seasonData, setSeasonData] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await tmdb.getDetails(mediaType, tmdbId);
                setDetails(data);
                if (mediaType === 'tv' && data.seasons?.length > 0) {
                    // Default to first season that isn't Specials (season 0) if possible
                    const cleanSeasons = data.seasons.filter(s => s.season_number > 0);
                    const defaultSeason = cleanSeasons.length > 0 ? cleanSeasons[0].season_number : 1;
                    setSeason(defaultSeason);
                }
            } catch (error) {
                console.error("Failed to load details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [mediaType, tmdbId]);

    useEffect(() => {
        if (mediaType === 'tv' && season > 0) {
            const fetchSeason = async () => {
                try {
                    // Construct the season fetch URL since it's not in our tmdb helper
                    const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
                    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=${TMDB_API_KEY}`);
                    const data = await res.json();
                    setSeasonData(data);
                    // Set episode to 1 when changing season, unless we just loaded
                    if (data.episodes && !data.episodes.find(e => e.episode_number === episode)) {
                        setEpisode(1);
                    }
                } catch (e) {
                    console.error("Failed to fetch season details");
                }
            };
            fetchSeason();
        }
    }, [mediaType, tmdbId, season]);

    if (loading) return <div className="loader">Loading Player...</div>;
    if (!details) return <div className="page-container" style={{ paddingTop: '100px', textAlign: 'center' }}>Content not found</div>;

    // Build Embed URL
    const embedBase = 'https://vidsrc.to/embed';
    // Alt options: https://multiembed.mov/?video_id=${tmdbId}&tmdb=1 
    // Let's stick to vidsrc.to for now.
    const embedUrl = mediaType === 'movie'
        ? `${embedBase}/movie/${tmdbId}`
        : `${embedBase}/tv/${tmdbId}/${season}/${episode}`;

    return (
        <>
            <Navbar />
            <div className="watch-container" style={{ paddingTop: '80px', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>

                {/* PLAYER WRAPPER */}
                <div className="player-wrapper" style={{ flex: 1, position: 'relative', width: '100%', backgroundColor: '#000' }}>
                    <iframe
                        src={embedUrl}
                        title="Video Player"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowFullScreen
                        style={{ border: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    ></iframe>
                </div>

                {/* METADATA & TV CONTROLS */}
                <div className="watch-info" style={{ padding: '24px 72px', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                            {mediaType === 'tv' && seasonData && (
                                <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '12px' }}>
                                    Season {season} · Episode {episode} {seasonData.episodes?.find(e => e.episode_number === episode)?.name && `- ${seasonData.episodes.find(e => e.episode_number === episode).name}`}
                                </div>
                            )}
                        </div>

                        {/* EPISODE SELECTOR */}
                        {mediaType === 'tv' && (
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Season</div>
                                    <select
                                        value={season}
                                        onChange={(e) => setSeason(parseInt(e.target.value))}
                                        style={{ background: 'var(--gray)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
                                    >
                                        {details.seasons?.filter(s => s.season_number > 0).map(s => (
                                            <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                                        ))}
                                    </select>
                                </div>

                                {seasonData && seasonData.episodes && (
                                    <div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Episode</div>
                                        <select
                                            value={episode}
                                            onChange={(e) => setEpisode(parseInt(e.target.value))}
                                            style={{ background: 'var(--gray)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            {seasonData.episodes.map(e => (
                                                <option key={e.episode_number} value={e.episode_number}>Ep {e.episode_number}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
