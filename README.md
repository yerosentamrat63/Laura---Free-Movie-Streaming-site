# laura.

A full-stack Netflix replica with a Nothing.tech editorial aesthetic.

## Stack
- **Frontend:** React 18 + Vite
- **Routing:** React Router v6
- **Auth:** Context API + localStorage persistence
- **Styling:** Pure CSS (custom variables, no UI lib)

## Pages

| Route | Page |
|-------|------|
| `/` | Home — hero, carousels, top 10, feature grid |
| `/series` | TV Series — hero, filter by genre, full grid |
| `/films` | Films — hero, filter, top rated, grid |
| `/new-hot` | New & Hot — tabs: Everyone's Watching / Coming Soon / Top 10 |
| `/my-list` | My List — user's saved content |
| `/browse` | Browse — genre cards + filtered grid |
| `/signin` | Sign In / Sign Up — full auth form |

## Features

- 🎬 **30+ titles** across shows and films with full metadata
- 🔐 **Auth** — sign in / sign up with form validation + success animation
- 📋 **My List** — add/remove titles, persisted in localStorage
- 🔍 **Search** — live search overlay (Cmd/Ctrl+K shortcut)
- 🎞️ **Modal** — click any title for details + play / add to list
- 🖱️ **Custom cursor** — mix-blend-mode, hover/click states
- ✨ **Scroll reveals** — IntersectionObserver staggered animations
- 🎠 **Carousels** — with arrow nav, numbered cards, wide cards
- 📺 **Marquee strip** — animated ticker
- 📐 **Feature grid** — editorial 2-column highlight layout
- 🌀 **Loader** — animated intro screen

## Design

Inspired by **Nothing.tech**: pitch black background, Space Mono monospace type,
Bebas Neue display font, surgical red accent, noise texture overlay, stark editorial layout.

## Getting Started

```bash
cd laura
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

> Sign in with any email + password (min 6 chars) to access the app.

## Build for Production

```bash
npm run build
npm run preview
```
