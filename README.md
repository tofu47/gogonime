# GoGoAnime Frontend

A modern React + TypeScript frontend for streaming anime from the GoGoAnime API.

## Features

- 🎬 Browse latest anime episodes
- � Detailed anime information with full episode lists
- 🎥 Watch episodes with resolution selection
- 👍 Like/dislike engagement system
- 📱 Responsive design (mobile, tablet, desktop)
- ⚡ Fast development with Vite
- 🎨 Beautiful UI with gradient animations
- 📦 TypeScript for type safety
- 🔄 Real-time data fetching from API

## Quick Start

```bash
# View all available commands
make help

# Install dependencies
make install

# Start development server
make dev

# Build for production
make build

# Preview production build
make preview
```

## Project Structure

```
gogoanime/
├── src/
│   ├── components/      # React components
│   │   ├── AnimeCard.tsx           # Anime card display
│   │   ├── AnimeDetailPage.tsx     # Detailed anime view with episodes
│   │   ├── EpisodePage.tsx         # Episode playing page
│   │   └── VideoPlayer.tsx         # Video player with controls
│   ├── services/
│   │   └── apiService.ts           # API service layer
│   ├── styles/          # Component styles
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
└── Makefile             # Make commands
```

## Navigation Flow

1. **List View** - Browse latest anime
2. **Detail View** - See anime info + full episode list
3. **Watch View** - Stream selected episode with quality selector

## API Endpoints

### Latest Anime
`GET https://api.sansekai.my.id/api/anime/latest`

Returns array of latest anime with:
- `id`: Unique identifier
- `url`: Anime URL slug
- `judul`: Title
- `cover`: Cover image URL
- `lastch`: Latest chapter/episode
- `lastup`: Last update status

### Anime Detail
`GET https://api.sansekai.my.id/api/anime/detail?urlId={urlId}`

Parameters:
- `urlId`: Anime URL identifier (e.g., `one-piece-z-01`)

Returns detailed anime information:
- Basic info: `judul`, `type`, `status`, `rating`, `published`, `author`
- `genre`: Array of genres
- `sinopsis`: Full description
- `chapter`: Array of all episodes with:
  - `id`: Chapter ID
  - `ch`: Chapter number
  - `url`: Chapter URL
  - `date`: Published date

### Episode Video Data
`GET https://api.sansekai.my.id/api/anime/getvideo?chapterUrlId={id}&reso={resolution}`

Parameters:
- `chapterUrlId`: Episode identifier (e.g., `al-150441-1135`)
- `reso`: Resolution in pixels (e.g., `480`, `720`)

Returns episode details:
- `episode_id`: Episode identifier
- `likeCount`: Number of likes
- `dislikeCount`: Number of dislikes
- `userLikeStatus`: User's like status (0 = neutral, 1 = liked, -1 = disliked)
- `reso`: Available resolutions array
- `stream`: Available streaming sources

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Axios** - HTTP client
- **CSS3** - Styling with gradients and animations

## Development

The project uses:
- ESLint for code quality
- Vitest for testing
- TypeScript strict mode

## License

MIT
