# Eloball

ELO rating system for foosball matches with seasons support. Track players, submit match results, and view rankings per season.

## Frontend Stack

- **Framework**: React 19 + React Router v7 (SPA mode, SSR disabled)
- **Build**: Vite 5 with `npm` as package manager
- **Language**: TypeScript (strict mode, ES2022 target)
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style) + class-variance-authority
- **State**: Redux Toolkit / RTK Query (server state), React Context (local UI state)
- **Charts**: Recharts (line charts for ELO progression)
- **Notifications**: Sonner toasts
- **Font**: Nunito (Google Fonts)

## Commands

```bash
cd src/frontend
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # Type checking
```

## Frontend Structure

```
src/frontend/
├── app/
│   ├── components/
│   │   └── ui/                    # shadcn/ui primitives (Button, Card, Input, Sonner)
│   ├── context/PlayerContext/     # Team selection state (addPlayer/removePlayer)
│   ├── lib/utils.ts               # cn() helper (clsx + tailwind-merge)
│   ├── routes/
│   │   ├── leaderboard.tsx        # Home — current season rankings + "Start Game" FAB
│   │   ├── game.tsx               # Match setup — player grid, team calibration, submit
│   │   ├── seasons.tsx            # Season history — summary cards for all seasons
│   │   └── season-detail.tsx      # Single season — full leaderboard + ELO chart
│   ├── routes.ts                  # Route config (/, /game, /seasons, /seasons/:id)
│   ├── store.ts                   # Redux store (RTK Query)
│   └── root.tsx                   # App shell, navigation (bottom tabs mobile / top nav desktop), providers
├── apis/foosball/
│   ├── foosball.ts                # RTK Query API (baseUrl: https://api.billigeterninger.dk/api/)
│   └── types.ts                   # Shared types: Player, Season, LeaderboardEntry, etc.
├── index.css                      # Design tokens (colors, animations)
└── public/                        # Static assets (logo.png, logo-dark.png)
```

## Conventions

- **Path alias**: `~` maps to `./app/*` — use for component/context imports
- **Exports**: Named exports for components (`export function Leaderboard`)
- **Types**: Defined in `apis/foosball/types.ts`, use `import type` for type-only imports
- **Styling**: Tailwind utility classes, use `cn()` for conditional class merging
- **Teams**: Team 1 = Red, Team 2 = Blue
- **Custom colors**: `--team-red`, `--team-blue`, `--gold`, `--silver`, `--bronze` defined in index.css

## API Endpoints

- `GET /player` — All players
- `POST /match` — Submit match result (`{ teamWonId, matches: [{ playerId, teamId }] }`)
- `GET /season` — All seasons
- `GET /season/active` — Current active season
- `GET /season/{id}` — Single season with matches
- `GET /season/{id}/leaderboard` — Season leaderboard with stats

RTK Query handles caching — submitting a match invalidates both `match` and `season` tags.

## Backend (C# / .NET 8)

Located in `src/api/`. Uses Entity Framework Core with SQL Server. Not the current development focus.
