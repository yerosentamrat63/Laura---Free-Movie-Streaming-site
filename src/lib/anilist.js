const ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  bannerImage
  coverImage { large extraLarge color }
  episodes
  averageScore
  genres
  format
  status
  seasonYear
  startDate { year }
  nextAiringEpisode { episode airingAt }
`;

const LIST_QUERY = `
  query ($sort: [MediaSort!], $genre: String, $search: String, $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, sort: $sort, genre: $genre, search: $search, status: $status, season: $season, seasonYear: $seasonYear) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${MEDIA_FIELDS}
    }
  }
`;

const cache = new Map();

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`AniList request failed (${res.status})`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message || 'AniList query failed');
  return json.data;
}

function stripHtml(text) {
  return (text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function mapMedia(media) {
  return {
    id: media.id,
    type: 'anime',
    title: media.title?.english || media.title?.romaji || 'Untitled',
    desc: stripHtml(media.description),
    img: media.coverImage?.large,
    imgWide: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large,
    year: media.startDate?.year || media.seasonYear || '',
    match: media.averageScore || 0,
    episodes: media.episodes || 0,
    nextEpisode: media.nextAiringEpisode?.episode || 0,
    format: media.format || '',
    status: media.status || '',
    genres: media.genres || []
  };
}

export async function fetchAnimeList({
  sort = 'TRENDING_DESC',
  genre = null,
  search = null,
  status = null,
  season = null,
  seasonYear = null,
  perPage = 24
} = {}) {
  const variables = { perPage, sort: sort ? [sort] : undefined };
  if (genre) variables.genre = genre;
  if (search) variables.search = search;
  if (status) variables.status = status;
  if (season) variables.season = season;
  if (seasonYear) variables.seasonYear = seasonYear;
  const key = JSON.stringify(variables);
  if (cache.has(key)) return cache.get(key);
  const data = await gql(LIST_QUERY, variables);
  const list = (data.Page?.media || []).map(mapMedia);
  cache.set(key, list);
  return list;
}

export async function fetchAnimeById(id) {
  const key = `byid:${id}`;
  if (cache.has(key)) return cache.get(key);
  const data = await gql(BY_ID_QUERY, { id: parseInt(id, 10) });
  if (!data.Media) throw new Error('Anime not found on AniList');
  const mapped = mapMedia(data.Media);
  cache.set(key, mapped);
  return mapped;
}
