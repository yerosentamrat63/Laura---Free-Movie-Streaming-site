const RED = '%23e50914';

const probeCineSrc = (data) => {
  const type = data?.type;
  if (typeof type !== 'string' || !type.startsWith('cinesrc:')) return null;
  return type === 'cinesrc:error' ? 'fail' : 'ok';
};

const probeTryEmbed = (data) => {
  const type = data?.type;
  if (typeof type !== 'string') return null;
  if (type.includes('ERROR')) return 'fail';
  return type === 'PLAYER_EVENT' ? 'ok' : null;
};

const probeAnyMessage = (data) => (data && typeof data === 'object' ? 'ok' : null);

export function getProviders({ mediaType, tmdbId, season = 1, episode = 1, lang = 'sub' }) {
  if (mediaType === 'anime') {
    const id = encodeURIComponent(tmdbId);
    const ep = encodeURIComponent(episode);
    const sub = lang === 'dub' ? 'dub' : 'sub';
    return [
      {
        id: 'tryembed',
        label: 'TryEmbed',
        origins: ['https://tryembed.us.cc'],
        url: `https://tryembed.us.cc/embed/anime/${id}/${ep}/${sub}`,
        probe: probeTryEmbed,
        requiresMessage: false
      },
      {
        id: 'megaplay',
        label: 'MegaPlay',
        origins: ['https://megaplay.buzz'],
        url: `https://megaplay.buzz/stream/ani/${id}/${ep}/${sub}`,
        probe: probeAnyMessage,
        requiresMessage: false
      },
      {
        id: 'vidnest',
        label: 'VidNest',
        origins: ['https://vidnest.fun'],
        url: `https://vidnest.fun/anime/${id}/${ep}/${sub}`,
        scrolling: 'no',
        probe: probeAnyMessage,
        requiresMessage: false
      }
    ];
  }

  const id = encodeURIComponent(tmdbId);
  const cinesrcUrl = mediaType === 'movie'
    ? `https://cinesrc.st/embed/movie/${id}?color=${RED}&autoplay=false&back=close`
    : `https://cinesrc.st/embed/tv/${id}?s=${encodeURIComponent(season)}&e=${encodeURIComponent(episode)}&color=${RED}&autoplay=false&back=close&autoskip=true`;

  return [
    {
      id: 'cinesrc',
      label: 'CineSrc',
      origins: ['https://cinesrc.st'],
      url: cinesrcUrl,
      allow: 'autoplay; fullscreen; picture-in-picture',
      probe: probeCineSrc,
      requiresMessage: true
    },
    {
      id: 'vidnest',
      label: 'VidNest',
      origins: ['https://vidnest.fun'],
      url: mediaType === 'movie'
        ? `https://vidnest.fun/movie/${id}`
        : `https://vidnest.fun/tv/${id}/${season}/${episode}`,
      scrolling: 'no',
      probe: probeAnyMessage,
      requiresMessage: false
    }
  ];
}
