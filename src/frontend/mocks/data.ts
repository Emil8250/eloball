import type { Season, LeaderboardEntry, Player } from '../apis/foosball/types'

export const mockPlayers: Player[] = [
  { id: 1, name: 'Magnus', elo: 1085, rank: 1 },
  { id: 2, name: 'Emil', elo: 1062, rank: 2 },
  { id: 3, name: 'Søren', elo: 1034, rank: 3 },
  { id: 4, name: 'Kasper', elo: 998, rank: 4 },
  { id: 5, name: 'Mikkel', elo: 971, rank: 5 },
  { id: 6, name: 'Jonas', elo: 952, rank: 6 },
  { id: 7, name: 'Frederik', elo: 1015, rank: 7 },
  { id: 8, name: 'Oliver', elo: 943, rank: 8 },
]

export const mockSeasons: Season[] = [
  {
    id: 7,
    name: 'Season 7',
    startDate: '2026-01-20T00:00:00Z',
    endDate: null,
    isActive: true,
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 6,
    name: 'Season 6',
    startDate: '2025-10-01T00:00:00Z',
    endDate: '2026-01-19T23:59:59Z',
    isActive: false,
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Season 5',
    startDate: '2025-07-01T00:00:00Z',
    endDate: '2025-09-30T23:59:59Z',
    isActive: false,
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Season 4',
    startDate: '2025-04-01T00:00:00Z',
    endDate: '2025-06-30T23:59:59Z',
    isActive: false,
    createdAt: '2025-04-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Season 3',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-03-31T23:59:59Z',
    isActive: false,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Season 2',
    startDate: '2024-09-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    isActive: false,
    createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 1,
    name: 'Season 1',
    startDate: '2024-05-01T00:00:00Z',
    endDate: '2024-08-31T23:59:59Z',
    isActive: false,
    createdAt: '2024-05-01T00:00:00Z',
  },
]

export const mockLeaderboards: Record<number, LeaderboardEntry[]> = {
  1: [
    { playerId: 1, playerName: 'Magnus', startingElo: 1000, finalElo: 1156, matchesPlayed: 45, matchesWon: 30, winRate: 0.67 },
    { playerId: 3, playerName: 'Søren', startingElo: 1000, finalElo: 1098, matchesPlayed: 40, matchesWon: 24, winRate: 0.60 },
    { playerId: 2, playerName: 'Emil', startingElo: 1000, finalElo: 1075, matchesPlayed: 38, matchesWon: 22, winRate: 0.58 },
    { playerId: 4, playerName: 'Kasper', startingElo: 1000, finalElo: 1012, matchesPlayed: 32, matchesWon: 17, winRate: 0.53 },
    { playerId: 5, playerName: 'Mikkel', startingElo: 1000, finalElo: 978, matchesPlayed: 30, matchesWon: 14, winRate: 0.47 },
    { playerId: 7, playerName: 'Frederik', startingElo: 1000, finalElo: 965, matchesPlayed: 28, matchesWon: 12, winRate: 0.43 },
    { playerId: 6, playerName: 'Jonas', startingElo: 1000, finalElo: 932, matchesPlayed: 20, matchesWon: 7, winRate: 0.35 },
    { playerId: 8, playerName: 'Oliver', startingElo: 1000, finalElo: 910, matchesPlayed: 18, matchesWon: 5, winRate: 0.28 },
  ],
  2: [
    { playerId: 2, playerName: 'Emil', startingElo: 1000, finalElo: 1142, matchesPlayed: 38, matchesWon: 24, winRate: 0.63 },
    { playerId: 1, playerName: 'Magnus', startingElo: 1000, finalElo: 1118, matchesPlayed: 42, matchesWon: 26, winRate: 0.62 },
    { playerId: 7, playerName: 'Frederik', startingElo: 1000, finalElo: 1067, matchesPlayed: 30, matchesWon: 18, winRate: 0.60 },
    { playerId: 3, playerName: 'Søren', startingElo: 1000, finalElo: 1031, matchesPlayed: 35, matchesWon: 19, winRate: 0.54 },
    { playerId: 4, playerName: 'Kasper', startingElo: 1000, finalElo: 985, matchesPlayed: 28, matchesWon: 13, winRate: 0.46 },
    { playerId: 5, playerName: 'Mikkel', startingElo: 1000, finalElo: 962, matchesPlayed: 33, matchesWon: 14, winRate: 0.42 },
    { playerId: 6, playerName: 'Jonas', startingElo: 1000, finalElo: 921, matchesPlayed: 25, matchesWon: 9, winRate: 0.36 },
    { playerId: 8, playerName: 'Oliver', startingElo: 1000, finalElo: 898, matchesPlayed: 22, matchesWon: 7, winRate: 0.32 },
  ],
  3: [
    { playerId: 3, playerName: 'Søren', startingElo: 1000, finalElo: 1168, matchesPlayed: 50, matchesWon: 34, winRate: 0.68 },
    { playerId: 1, playerName: 'Magnus', startingElo: 1000, finalElo: 1095, matchesPlayed: 44, matchesWon: 26, winRate: 0.59 },
    { playerId: 2, playerName: 'Emil', startingElo: 1000, finalElo: 1082, matchesPlayed: 41, matchesWon: 24, winRate: 0.59 },
    { playerId: 6, playerName: 'Jonas', startingElo: 1000, finalElo: 1045, matchesPlayed: 36, matchesWon: 21, winRate: 0.58 },
    { playerId: 7, playerName: 'Frederik', startingElo: 1000, finalElo: 1008, matchesPlayed: 32, matchesWon: 17, winRate: 0.53 },
    { playerId: 4, playerName: 'Kasper', startingElo: 1000, finalElo: 958, matchesPlayed: 30, matchesWon: 13, winRate: 0.43 },
    { playerId: 5, playerName: 'Mikkel', startingElo: 1000, finalElo: 935, matchesPlayed: 28, matchesWon: 11, winRate: 0.39 },
    { playerId: 8, playerName: 'Oliver', startingElo: 1000, finalElo: 882, matchesPlayed: 24, matchesWon: 7, winRate: 0.29 },
  ],
  4: [
    { playerId: 1, playerName: 'Magnus', startingElo: 1000, finalElo: 1134, matchesPlayed: 48, matchesWon: 31, winRate: 0.65 },
    { playerId: 4, playerName: 'Kasper', startingElo: 1000, finalElo: 1112, matchesPlayed: 46, matchesWon: 29, winRate: 0.63 },
    { playerId: 2, playerName: 'Emil', startingElo: 1000, finalElo: 1058, matchesPlayed: 39, matchesWon: 22, winRate: 0.56 },
    { playerId: 3, playerName: 'Søren', startingElo: 1000, finalElo: 1021, matchesPlayed: 37, matchesWon: 20, winRate: 0.54 },
    { playerId: 7, playerName: 'Frederik', startingElo: 1000, finalElo: 992, matchesPlayed: 33, matchesWon: 16, winRate: 0.48 },
    { playerId: 6, playerName: 'Jonas', startingElo: 1000, finalElo: 968, matchesPlayed: 29, matchesWon: 13, winRate: 0.45 },
    { playerId: 8, playerName: 'Oliver', startingElo: 1000, finalElo: 945, matchesPlayed: 26, matchesWon: 11, winRate: 0.42 },
    { playerId: 5, playerName: 'Mikkel', startingElo: 1000, finalElo: 918, matchesPlayed: 25, matchesWon: 9, winRate: 0.36 },
  ],
  5: [
    { playerId: 7, playerName: 'Frederik', startingElo: 1000, finalElo: 1175, matchesPlayed: 52, matchesWon: 36, winRate: 0.69 },
    { playerId: 2, playerName: 'Emil', startingElo: 1000, finalElo: 1108, matchesPlayed: 43, matchesWon: 27, winRate: 0.63 },
    { playerId: 1, playerName: 'Magnus', startingElo: 1000, finalElo: 1065, matchesPlayed: 40, matchesWon: 23, winRate: 0.58 },
    { playerId: 6, playerName: 'Jonas', startingElo: 1000, finalElo: 1032, matchesPlayed: 35, matchesWon: 19, winRate: 0.54 },
    { playerId: 3, playerName: 'Søren', startingElo: 1000, finalElo: 988, matchesPlayed: 34, matchesWon: 16, winRate: 0.47 },
    { playerId: 5, playerName: 'Mikkel', startingElo: 1000, finalElo: 972, matchesPlayed: 31, matchesWon: 14, winRate: 0.45 },
    { playerId: 4, playerName: 'Kasper', startingElo: 1000, finalElo: 948, matchesPlayed: 28, matchesWon: 11, winRate: 0.39 },
    { playerId: 8, playerName: 'Oliver', startingElo: 1000, finalElo: 895, matchesPlayed: 22, matchesWon: 6, winRate: 0.27 },
  ],
  6: [
    { playerId: 2, playerName: 'Emil', startingElo: 1000, finalElo: 1148, matchesPlayed: 47, matchesWon: 30, winRate: 0.64 },
    { playerId: 1, playerName: 'Magnus', startingElo: 1000, finalElo: 1122, matchesPlayed: 44, matchesWon: 28, winRate: 0.64 },
    { playerId: 3, playerName: 'Søren', startingElo: 1000, finalElo: 1078, matchesPlayed: 42, matchesWon: 25, winRate: 0.60 },
    { playerId: 7, playerName: 'Frederik', startingElo: 1000, finalElo: 1015, matchesPlayed: 36, matchesWon: 19, winRate: 0.53 },
    { playerId: 5, playerName: 'Mikkel', startingElo: 1000, finalElo: 998, matchesPlayed: 34, matchesWon: 17, winRate: 0.50 },
    { playerId: 4, playerName: 'Kasper', startingElo: 1000, finalElo: 965, matchesPlayed: 30, matchesWon: 13, winRate: 0.43 },
    { playerId: 6, playerName: 'Jonas', startingElo: 1000, finalElo: 942, matchesPlayed: 27, matchesWon: 10, winRate: 0.37 },
    { playerId: 8, playerName: 'Oliver', startingElo: 1000, finalElo: 908, matchesPlayed: 23, matchesWon: 7, winRate: 0.30 },
  ],
}

/** Route mock responses based on URL path */
export function getMockResponse(url: string): unknown | undefined {
  const path = url.replace('https://api.billigeterninger.dk/api/', '')

  if (path === 'player') return mockPlayers
  if (path === 'season') return mockSeasons
  if (path === 'season/active') return mockSeasons.find(s => s.isActive)

  const seasonMatch = path.match(/^season\/(\d+)$/)
  if (seasonMatch) return mockSeasons.find(s => s.id === Number(seasonMatch[1]))

  const lbMatch = path.match(/^season\/(\d+)\/leaderboard$/)
  if (lbMatch) return mockLeaderboards[Number(lbMatch[1])] ?? []

  return undefined
}
