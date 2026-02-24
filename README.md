# Eloball

Eloball is a foosball (table football) ELO rating tracker. Players record 1v1 and 2v2 match results, and the system updates ELO ratings accordingly. Organized into seasons — each season resets ELO to 1000 and archives the final standings.

## Tech Stack

**Frontend** — React 19, React Router v7 (SPA mode), TypeScript, Tailwind CSS v4, Redux Toolkit / RTK Query, Recharts, shadcn/ui

**Backend** — .NET 8 Web API, hosted at `api.billigeterninger.dk`

## Features

- **Leaderboard** — Live player rankings sorted by ELO with win/loss records
- **Match Recording** — Drag players onto Team 1 / Team 2, supports 1v1 and 2v2
- **Seasons** — Start/end seasons, which snapshot player stats (W/L, final ELO) and reset ratings to 1000
- **Season History** — Browse past seasons with full leaderboards and an ELO-over-seasons chart
- **Dark Mode** — Follows system preference automatically

## Project Structure

```
src/
├── api/                          # .NET 8 backend
│   ├── Controllers/
│   │   ├── PlayerController.cs
│   │   ├── MatchController.cs
│   │   └── SeasonController.cs
│   └── Program.cs
└── frontend/                     # React SPA
    ├── apis/foosball/            # RTK Query API + types
    ├── app/
    │   ├── root.tsx              # Layout, nav, providers
    │   └── routes/
    │       ├── leaderboard.tsx   # / — player rankings
    │       ├── game.tsx          # /game — match setup
    │       ├── seasons.tsx       # /seasons — season list + chart
    │       └── season-detail.tsx # /seasons/:id — season leaderboard
    ├── components/ui/            # shadcn/ui components
    ├── mocks/data.ts             # Mock data (append ?mock to URL)
    └── index.css                 # Tailwind + CSS variables
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/player` | All players with current ELO |
| POST | `/api/match` | Record a match result |
| GET | `/api/season` | All seasons (newest first) |
| GET | `/api/season/active` | Current active season |
| GET | `/api/season/{id}/leaderboard` | Season standings |
| POST | `/api/season/{id}/end` | End season (snapshots stats, resets ELO) |
| POST | `/api/season` | Create new season |

## Development

```bash
cd src/frontend
npm install
npm run dev
```

Add `?mock` to the URL to use mock data instead of the live API.

## License

MIT
  