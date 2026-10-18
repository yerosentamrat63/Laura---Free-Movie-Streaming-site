# Laura

Laura is a movie, series, and anime discovery and streaming interface built with React and Vite.

## Stack

- React 18 and Vite
- React Router 6
- Supabase Auth and database for accounts and user data
- TMDB for movie and TV metadata
- AniList for anime metadata
- Custom CSS, using the dark teal `#07191E` palette and green `#02F5A1` accent

## Pages

| Route | Page |
| --- | --- |
| `/` | Home, featured titles, carousels, and recommendations |
| `/series` | TV series discovery and genre filters |
| `/films` | Film discovery and top rated titles |
| `/new-hot` | Trending, upcoming, and popular titles |
| `/my-list` | Your saved titles (sign in required) |
| `/browse` | Browse titles by genre |
| `/anime` | Anime discovery, search, and genre filters |
| `/signin` | Sign in and create an account |
| `/watch/:mediaType/:tmdbId` | Movie or series player |
| `/watch/:mediaType/:tmdbId/:episode/:lang` | Anime player with episode and subtitle/dub selection |

## Features

- Search, title details, genre filters, and responsive carousels
- Save titles, resume watch history, and set release reminders when signed in
- Supabase email/password and Google sign-in
- Third-party embedded playback providers with source selection
- Responsive layouts and consistent controls across pages

Playback is provided by third-party embeds (CineSrc and VidNest for movies and TV; TryEmbed, MegaPlay, and VidNest for anime). Availability and playback behavior depend on those providers. Laura does not host video files.

## Configuration

Copy `.env.example` to `.env` and set the keys for the services you use:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

TMDB is needed for movie and TV listings. Supabase enables accounts and synced user data such as saved titles, watch history, and reminders. Configure the Supabase project and its required tables and policies before enabling those features. Never put a Supabase service-role key in this frontend app.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)).

## Production build

```bash
npm run build
npm run preview
```

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie and TV metadata and imagery are provided by [TMDB](https://www.themoviedb.org). Anime metadata is provided by [AniList](https://anilist.co).
