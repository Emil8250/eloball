import type { PlayerMatchRecord } from "../../apis/foosball/types";

// CS-style rank inactivity tuning. A player must have played PLACEMENT_GAMES
// matches in a season to be ranked, and must have played within INACTIVITY_DAYS
// of the reference point (now, or the season's end) to stay ranked.
export const PLACEMENT_GAMES = 3;
export const INACTIVITY_DAYS = 11;

export type RankStatus = "active" | "inactive" | "calibrating";

export interface PlayerStats {
  name: string;
  playerId: number;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
  lastMatch: number; // epoch ms of the player's most recent match in scope
  eggsGiven: number;
  eggsReceived: number;
  teammates: Record<string, { games: number; wins: number }>;
  opponents: Record<string, { games: number; winsOver: number; lossesTo: number }>;
  streak: { type: "W" | "L"; count: number };
  dayStats: Record<number, { wins: number; total: number }>;
}

/**
 * Classify a player for ranking purposes within a season.
 * `referenceTime` is the point activity is measured against — `Date.now()` for an
 * active season, or the season's end time for a completed one.
 */
export function classifyRank(stats: PlayerStats | undefined, referenceTime: number): RankStatus {
  if (!stats || stats.matches < PLACEMENT_GAMES) return "calibrating";
  if (stats.lastMatch < referenceTime - INACTIVITY_DAYS * 86_400_000) return "inactive";
  return "active";
}

export function buildMatchesFromRecords(records: PlayerMatchRecord[], seasonId?: number) {
  const filtered = seasonId ? records.filter(r => r.match.seasonId === seasonId) : records;
  const grouped: Record<number, PlayerMatchRecord[]> = {};
  for (const r of filtered) {
    (grouped[r.matchId] ??= []).push(r);
  }
  return Object.values(grouped);
}

export function computePlayerStats(records: PlayerMatchRecord[], seasonId?: number): Map<number, PlayerStats> {
  const matches = buildMatchesFromRecords(records, seasonId);
  const stats = new Map<number, PlayerStats>();

  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a[0].match.createdDateTime).getTime() - new Date(b[0].match.createdDateTime).getTime()
  );

  for (const pms of sortedMatches) {
    const winningTeam = pms[0].match.playerWonId;

    for (const pm of pms) {
      if (!stats.has(pm.playerId)) {
        stats.set(pm.playerId, {
          name: pm.player.name,
          playerId: pm.playerId,
          wins: 0,
          losses: 0,
          matches: 0,
          winRate: 0,
          lastMatch: 0,
          eggsGiven: 0,
          eggsReceived: 0,
          teammates: {},
          opponents: {},
          streak: { type: "W", count: 0 },
          dayStats: {},
        });
      }
      const s = stats.get(pm.playerId)!;
      const won = pm.team === winningTeam;
      s.matches++;
      // sortedMatches is ascending, so the last write is the most recent match.
      s.lastMatch = new Date(pm.match.createdDateTime).getTime();
      if (won) s.wins++;
      else s.losses++;
      s.winRate = s.matches > 0 ? s.wins / s.matches : 0;

      if (pm.match.egg) {
        if (won) s.eggsGiven++;
        else s.eggsReceived++;
      }

      if (s.streak.type === (won ? "W" : "L")) {
        s.streak.count++;
      } else {
        s.streak = { type: won ? "W" : "L", count: 1 };
      }

      const day = new Date(pm.match.createdDateTime).getDay();
      s.dayStats[day] ??= { wins: 0, total: 0 };
      s.dayStats[day].total++;
      if (won) s.dayStats[day].wins++;

      for (const t of pms) {
        if (t.playerId !== pm.playerId && t.team === pm.team) {
          const key = t.player.name;
          s.teammates[key] ??= { games: 0, wins: 0 };
          s.teammates[key].games++;
          if (won) s.teammates[key].wins++;
        }
      }

      for (const o of pms) {
        if (o.team !== pm.team) {
          const key = o.player.name;
          s.opponents[key] ??= { games: 0, winsOver: 0, lossesTo: 0 };
          s.opponents[key].games++;
          if (won) s.opponents[key].winsOver++;
          else s.opponents[key].lossesTo++;
        }
      }
    }
  }

  return stats;
}
