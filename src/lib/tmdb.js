const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Helper to construct image URLs
export const getImageUrl = (path, size = 'w500') => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Generic fetcher
export const fetchTMDB = async (endpoint, params = {}) => {
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        ...params,
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status}`);
    }
    return response.json();
};

export const mapTMDBToContent = (item, mediaType = 'movie') => {
    const isTv = item.media_type === 'tv' || mediaType === 'tv';
    return {
        id: item.id.toString(),
        title: item.title || item.name,
        type: isTv ? 'series' : 'film',
        year: (item.release_date || item.first_air_date || '').split('-')[0],
        match: Math.round((item.vote_average || 0) * 10),
        desc: item.overview,
        img: getImageUrl(item.poster_path, 'w500'),
        imgWide: getImageUrl(item.backdrop_path, 'w1280'),
        genreIds: item.genre_ids,
    };
};

export const tmdb = {
    // Home page categories
    getTrending: (mediaType = 'all', timeWindow = 'week') =>
        fetchTMDB(`/trending/${mediaType}/${timeWindow}`),

    getNetflixOriginals: () =>
        fetchTMDB('/discover/tv', { with_networks: 213, sort_by: 'popularity.desc' }),

    getTopRated: (mediaType = 'movie') =>
        fetchTMDB(`/${mediaType}/top_rated`),

    // Discover by genre
    getMoviesByGenre: (genreId) =>
        fetchTMDB('/discover/movie', { with_genres: genreId }),

    getTvShowsByGenre: (genreId) =>
        fetchTMDB('/discover/tv', { with_genres: genreId }),

    // Details
    getDetails: (mediaType, id) =>
        fetchTMDB(`/${mediaType}/${id}`, { append_to_response: 'videos,credits,similar' }),

    // Search
    search: (query, page = 1) =>
        fetchTMDB('/search/multi', { query, page }),

    // Genres list
    getMovieGenres: () => fetchTMDB('/genre/movie/list'),
    getTvGenres: () => fetchTMDB('/genre/tv/list'),
};
