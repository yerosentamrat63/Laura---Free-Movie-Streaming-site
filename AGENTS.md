# AGENTS.md — laura (Netflix replica)

## Project overview

`laura` is a full-stack Netflix-style streaming app with a Nothing.tech editorial aesthetic (pitch black, Space Mono, Bebas Neue, red accent `#e50914`, noise texture).

- **Location:** `C:\Users\yeros\Downloads\projects\laura-app\laura` (repo root is one level up: `laura-app\`)
- **Stack:** React 18 + Vite 5, React Router v6, Supabase (auth + DB), TMDB API (metadata/images), AniList GraphQL (anime catalog, no key), pure CSS (no UI lib), Vercel deploy (`.vercel/`)
- **Run:** `npm run dev` → http://localhost:5173 · `npm run build` · `npm run preview`
- **Env (`.env`):** `VITE_TMDB_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — nothing else is needed

## Structure

```
src/
  App.jsx                 routes, modal/search state, Cmd+K, ProtectedRoute(/my-list)
  pages/                  Home, Series, Films, NewHot, Anime, MyList, Browse, SignIn, Watch
  components/             Navbar, Carousel, Modal, SearchOverlay, Cursor, Loader, Footer
  context/AuthContext.jsx Supabase auth + my_list / watch_history / reminders
  lib/tmdb.js             TMDB fetcher + mapTMDBToContent
  lib/anilist.js          AniList GraphQL (fetchAnimeList / fetchAnimeById, in-memory cache)
  lib/players.js          embed-provider registry: getProviders() → [{id,label,url,origins,probe,…}]
  lib/supabase.js         client (null when env vars missing)
  styles/global.css       all styling (~2.1k lines, CSS vars: --red, --mono, --display)
supabase_setup.sql        tables + RLS policies (run in Supabase SQL editor)
```

## Conventions

- Inline `style={{}}` is used heavily in pages/components; global classes live in `global.css`.
- Design tokens: `var(--red)` #e50914, `var(--mono)` Space Mono, `var(--display)` Bebas Neue, `var(--text-dim)`.
- No comments in code unless asked. Build must pass: `npm run build`.

## Player (Watch page) — CURRENT STATE

`src/pages/Watch.jsx` renders **third-party embed iframes** with an automatic fallback chain. There is **no local backend** — `cinepro-core` was deleted, `hls.js` removed. The player is entirely iframe-based.

### Provider registry (`src/lib/players.js`)

`getProviders({ mediaType, tmdbId, season, episode, lang })` returns the ordered chain for the current title. All URLs verified against each provider's own docs.

**Movies / TV (TMDB id):**
1. **CineSrc** — `https://cinesrc.st/embed/movie/{tmdbId}` · `https://cinesrc.st/embed/tv/{tmdbId}?s={s}&e={e}`
   - params used: `color=%23e50914`, `autoplay=false`, `back=close`, `autoskip=true` (TV)
   - iframe attrs: `frameborder allowfullscreen allow="autoplay; fullscreen; picture-in-picture"`
   - **Docs:** https://cinesrc.st/docs — richest API of all five
   - health: requires a postMessage from origin `https://cinesrc.st` (`cinesrc:ready`, `cinesrc:timeupdate`, …)
   - failover: `cinesrc:error` → immediate switch
   - events used by Watch.jsx: `cinesrc:nextepisode` with `internalNavigation: true` → updates episode state **without** rebuilding the iframe URL (suppressUrl ref); `cinesrc:close` → navigate back
2. **VidNest** — `https://vidnest.fun/movie/{tmdbId}` · `https://vidnest.fun/tv/{tmdbId}/{s}/{e}`
   - iframe attrs: `frameBorder="0" scrolling="no" allowFullScreen`
   - docs: https://vidnest.fun/ · params: `startAt`, `progress`, `server`, control-hiding flags
   - health: iframe `load` event (plus any postMessage from origin)

**Anime (AniList id, episode, sub|dub):**
1. **TryEmbed** — `https://tryembed.us.cc/embed/anime/{anilistId}/{ep}/{sub|dub}` (docs: https://tryembed.us.cc/)
2. **MegaPlay** — `https://megaplay.buzz/stream/ani/{anilistId}/{ep}/{sub|dub}` (docs: https://megaplay.buzz/api)
3. **VidNest** — `https://vidnest.fun/anime/{anilistId}/{ep}/{sub|dub}`
   - health for all three: iframe `load`; TryEmbed also postMessages `PLAYER_EVENT`

### Health / fallback model (in `Watch.jsx`)

- Frame mounts with `key={providerIndex}-{reloadKey}`; `frameUrl` is state, rebuilt from `providers[providerIndex]` whenever providers/providerIndex change — **unless** `suppressUrl.current` is set (CineSrc internal episode navigation).
- On every `frameUrl` change: overlay shown, `healthy=false`, timers reset:
  - **4s** → loading overlay auto-dismisses (iframe `load` can hang; never gate solely on it)
  - **7s** → `.player-slow-bar` chip: "`X` is slow to respond — a backup takes over automatically…"
  - **15s** without a health signal → `failover()` → next provider + chip "X did not respond — switched to Y."
  - explicit error event (`cinesrc:error`) → immediate failover
- `requiresMessage: true` (CineSrc only) = iframe `load` does NOT count as healthy; only a postMessage from the right origin does.
- Providers exhausted → "PLAYER UNAVAILABLE" + Retry (restarts chain at index 0) / Go back.
- Manual **Source** buttons in the info bar switch providers instantly.

### Watch page routes

- `/watch/:mediaType/:tmdbId` — movie / tv / anime (anime: tmdbId slot holds AniList id)
- `/watch/:mediaType/:tmdbId/:episode/:lang` — anime with explicit episode + sub/dub (navigated with `replace: true` from the episode/audio controls)

### Watch info bar controls

- TV: Season select, Episode select (TMDB season data)
- Anime: Episode select (or number input when `episodes` unknown), Audio sub/dub toggle
- All: Source buttons (one per provider), Reload (`hardReload` resets provider index + details)

### History / list integration

- `saveToHistory` for anime uses `type: 'anime'` + episode. **Home's Continue Watching row** routes anime items through `fetchAnimeById`, not TMDB (see `Home.jsx`).
- Anime catalog cards on `/anime` navigate straight to `/watch/anime/{id}/1/sub` — they do NOT open the Modal, so no anime enters `my_list` (MyList.jsx still assumes TMDB types only — keep it that way or update both sides).

## Anime catalog (`/anime` page)

- Source: **AniList GraphQL** (`https://graphql.anilist.co`, no API key). `lib/anilist.js` has a module-level `Map` cache — same query never refetches in a session.
- Tabs: Trending / Popular This Season / Top Rated / Upcoming; 12 genre chips; debounced (400ms) search box (typing switches to search mode, clears tabs).
- `mapMedia()` output shape mirrors `mapTMDBToContent` (`id` is AniList numeric id, `type: 'anime'`, `match` = averageScore).

## Environment traps (check these BEFORE blaming code)

The user reported "it doesn't work" multiple times; every time it was environmental:

1. **Stale bundle** — browser showing old code. Fix: Ctrl+Shift+R hard refresh.
2. **Dev server dead** — check first: `Get-NetTCPConnection -LocalPort 5173 -State Listen` + `curl http://localhost:5173/`. Log: `laura/dev.log`. Restart detached if needed.
3. **Ad blocker ON** — some embed providers spin forever with uBlock/AdBlock on. Ask user to disable for testing.

Always verify server is up (`curl -o NUL -w "%{http_code}"`) and which UI text is on screen before diagnosing — if old UI text appears that no longer exists in code, it's a stale bundle.

## Known risks / open items

- **Click-hijack redirects** — still the open question. None of the five providers document `sandbox` support; if a provider injects top-navigation ads on click, options are: plain iframe (current), or open the player in its own tab. Verify with real playback tests before changing anything.
- **Ad levels are self-reported** — TryEmbed claims zero popups, CineSrc says "minimal ads", VidNest gates ad-free behind a paid boost. Unverified in practice.
- All five are unofficial services on domains that can move; the fallback chain is the hedge.

## Attribution

Uses TMDB API — required attribution: "This product uses the TMDB API but is not endorsed or certified by TMDB."
