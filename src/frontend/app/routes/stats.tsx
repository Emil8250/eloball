import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useGetPlayerMatchesQuery, useGetSeasonsQuery } from "../../apis/foosball/foosball";
import type { PlayerMatchRecord } from "../../apis/foosball/types";
import { Gamepad2, Trophy, Swords, Users, Flame, Target, Shield, Heart, TrendingUp } from "lucide-react";

export function meta() {
  return [{ title: "Eloball — Stats" }];
}

// --- Stats computation ---

interface PlayerStats {
  name: string;
  playerId: number;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
  teammates: Record<string, { games: number; wins: number }>;
  opponents: Record<string, { games: number; winsOver: number; lossesTo: number }>;
  streak: { type: "W" | "L"; count: number };
}

interface DuoStats {
  names: [string, string];
  games: number;
  wins: number;
  winRate: number;
}

interface RivalryStats {
  names: [string, string];
  games: number;
}

function buildMatchesFromRecords(records: PlayerMatchRecord[], seasonId?: number) {
  const filtered = seasonId ? records.filter(r => r.match.seasonId === seasonId) : records;
  const grouped: Record<number, PlayerMatchRecord[]> = {};
  for (const r of filtered) {
    (grouped[r.matchId] ??= []).push(r);
  }
  return Object.values(grouped);
}

function computePlayerStats(records: PlayerMatchRecord[], seasonId?: number): Map<number, PlayerStats> {
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
          teammates: {},
          opponents: {},
          streak: { type: "W", count: 0 },
        });
      }
      const s = stats.get(pm.playerId)!;
      const won = pm.team === winningTeam;
      s.matches++;
      if (won) s.wins++;
      else s.losses++;
      s.winRate = s.matches > 0 ? s.wins / s.matches : 0;

      if (s.streak.type === (won ? "W" : "L")) {
        s.streak.count++;
      } else {
        s.streak = { type: won ? "W" : "L", count: 1 };
      }

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

function computeDuoStats(records: PlayerMatchRecord[], seasonId?: number): DuoStats[] {
  const matches = buildMatchesFromRecords(records, seasonId);
  const duos: Record<string, { names: [string, string]; games: number; wins: number }> = {};

  for (const pms of matches) {
    const winningTeam = pms[0].match.playerWonId;
    const teams: Record<number, PlayerMatchRecord[]> = {};
    for (const pm of pms) {
      (teams[pm.team] ??= []).push(pm);
    }

    for (const teamPms of Object.values(teams)) {
      if (teamPms.length === 2) {
        const sorted = [teamPms[0].player.name, teamPms[1].player.name].sort();
        const key = sorted.join("+");
        duos[key] ??= { names: sorted as [string, string], games: 0, wins: 0 };
        duos[key].games++;
        if (teamPms[0].team === winningTeam) duos[key].wins++;
      }
    }
  }

  return Object.values(duos)
    .map(d => ({ ...d, winRate: d.games > 0 ? d.wins / d.games : 0 }))
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games);
}

function computeRivalryStats(records: PlayerMatchRecord[], seasonId?: number): RivalryStats[] {
  const matches = buildMatchesFromRecords(records, seasonId);
  const rivalries: Record<string, { names: [string, string]; games: number }> = {};

  for (const pms of matches) {
    const teams: Record<number, PlayerMatchRecord[]> = {};
    for (const pm of pms) {
      (teams[pm.team] ??= []).push(pm);
    }
    const teamArrays = Object.values(teams);
    if (teamArrays.length === 2) {
      for (const p1 of teamArrays[0]) {
        for (const p2 of teamArrays[1]) {
          const sorted = [p1.player.name, p2.player.name].sort();
          const key = sorted.join("vs");
          rivalries[key] ??= { names: sorted as [string, string], games: 0 };
          rivalries[key].games++;
        }
      }
    }
  }

  return Object.values(rivalries).sort((a, b) => b.games - a.games);
}

// --- Components ---

function HighlightCard({ icon: Icon, label, value, sub, color, delay }: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="bg-card rounded-2xl border border-border/50 p-4 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-extrabold truncate">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function PlayerDetail({ stats }: { stats: PlayerStats }) {
  const favoriteTeammate = Object.entries(stats.teammates)
    .sort((a, b) => b[1].games - a[1].games)[0];
  const bestTeammate = Object.entries(stats.teammates)
    .filter(([, v]) => v.games >= 2)
    .sort((a, b) => (b[1].wins / b[1].games) - (a[1].wins / a[1].games))[0];
  const nemesis = Object.entries(stats.opponents)
    .sort((a, b) => b[1].lossesTo - a[1].lossesTo)[0];
  const victim = Object.entries(stats.opponents)
    .sort((a, b) => b[1].winsOver - a[1].winsOver)[0];

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-slide-up">
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="font-extrabold text-lg">{stats.name}</h3>
        <p className="text-sm text-muted-foreground">
          {stats.wins}W / {stats.losses}L
          <span className="mx-1.5">&middot;</span>
          <span className="font-semibold">{Math.round(stats.winRate * 100)}% WR</span>
          <span className="mx-1.5">&middot;</span>
          {stats.matches} played
        </p>
      </div>
      <div className="divide-y divide-border/30">
        {stats.streak.count >= 2 && (
          <StatRow
            icon={Flame}
            iconColor="text-orange-500"
            label={stats.streak.type === "W" ? "Win Streak" : "Loss Streak"}
            value={`${stats.streak.count} ${stats.streak.type === "W" ? "wins" : "losses"}`}
          />
        )}
        {favoriteTeammate && (
          <StatRow
            icon={Heart}
            iconColor="text-pink-500"
            label="Plays most with"
            value={favoriteTeammate[0]}
            sub={`${favoriteTeammate[1].games} games together`}
          />
        )}
        {bestTeammate && bestTeammate[0] !== favoriteTeammate?.[0] && (
          <StatRow
            icon={Users}
            iconColor="text-emerald-500"
            label="Best teammate"
            value={bestTeammate[0]}
            sub={`${Math.round((bestTeammate[1].wins / bestTeammate[1].games) * 100)}% WR together`}
          />
        )}
        {victim && victim[1].winsOver > 0 && (
          <StatRow
            icon={Target}
            iconColor="text-amber-500"
            label="Beats most"
            value={victim[0]}
            sub={`${victim[1].winsOver}W / ${victim[1].lossesTo}L against`}
          />
        )}
        {nemesis && nemesis[1].lossesTo > 0 && (
          <StatRow
            icon={Shield}
            iconColor="text-red-500"
            label="Nemesis"
            value={nemesis[0]}
            sub={`${nemesis[1].lossesTo}L / ${nemesis[1].winsOver}W against`}
          />
        )}
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, iconColor, label, value, sub }: {
  icon: typeof Trophy;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={16} className={`shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-sm truncate">{value}</p>
      </div>
      {sub && <p className="text-xs text-muted-foreground shrink-0">{sub}</p>}
    </div>
  );
}

// --- Page ---

export default function Stats() {
  const { data: allRecords, isLoading: recordsLoading } = useGetPlayerMatchesQuery();
  const { data: seasons, isLoading: seasonsLoading } = useGetSeasonsQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const playerIdFromUrl = searchParams.get("player") ? Number(searchParams.get("player")) : null;
  const seasonIdFromUrl = searchParams.get("season") ? Number(searchParams.get("season")) : null;
  const [seasonFilter, setSeasonFilter] = useState<number | null>(seasonIdFromUrl);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(playerIdFromUrl);

  const isLoading = recordsLoading || seasonsLoading;

  const playerStats = useMemo(
    () => allRecords ? computePlayerStats(allRecords, seasonFilter ?? undefined) : new Map(),
    [allRecords, seasonFilter]
  );

  const duoStats = useMemo(
    () => allRecords ? computeDuoStats(allRecords, seasonFilter ?? undefined) : [],
    [allRecords, seasonFilter]
  );

  const rivalryStats = useMemo(
    () => allRecords ? computeRivalryStats(allRecords, seasonFilter ?? undefined) : [],
    [allRecords, seasonFilter]
  );

  const bestWinRate = useMemo(() => {
    const eligible = [...playerStats.values()].filter(s => s.matches >= 5);
    return eligible.sort((a, b) => b.winRate - a.winRate)[0];
  }, [playerStats]);

  const mostGames = useMemo(() => {
    return [...playerStats.values()].sort((a, b) => b.matches - a.matches)[0];
  }, [playerStats]);

  const bestDuo = useMemo(() => {
    return duoStats.filter(d => d.games >= 3)[0];
  }, [duoStats]);

  const biggestRivalry = useMemo(() => rivalryStats[0], [rivalryStats]);

  const sortedPlayers = useMemo(
    () => [...playerStats.values()].sort((a, b) => b.matches - a.matches),
    [playerStats]
  );

  // Once data loads, resolve URL param player
  const activePlayerId = selectedPlayer && playerStats.has(selectedPlayer) ? selectedPlayer : null;
  const activePlayerStats = activePlayerId ? playerStats.get(activePlayerId) : null;

  function updateParams(playerId: number | null, seasonId: number | null) {
    setSelectedPlayer(playerId);
    setSeasonFilter(seasonId);
    const params: Record<string, string> = {};
    if (playerId) params.player = String(playerId);
    if (seasonId) params.season = String(seasonId);
    setSearchParams(params);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Gamepad2 size={40} className="text-primary animate-bounce" />
          <p className="text-muted-foreground font-medium">Crunching numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Statistics</h1>
        <p className="text-sm text-muted-foreground">All-time stats and records</p>
      </div>

      {seasons && seasons.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => updateParams(null, null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              seasonFilter === null
                ? "bg-violet-500 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Time
          </button>
          {[...seasons].sort((a, b) => b.id - a.id).map(s => (
            <button
              key={s.id}
              onClick={() => updateParams(null, s.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                seasonFilter === s.id
                  ? "bg-violet-500 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {bestWinRate && (
          <HighlightCard
            icon={TrendingUp}
            label="Best Win Rate"
            value={bestWinRate.name}
            sub={`${Math.round(bestWinRate.winRate * 100)}% in ${bestWinRate.matches} games`}
            color="bg-emerald-500"
            delay={0}
          />
        )}
        {mostGames && (
          <HighlightCard
            icon={Gamepad2}
            label="Most Games"
            value={mostGames.name}
            sub={`${mostGames.matches} matches played`}
            color="bg-blue-500"
            delay={60}
          />
        )}
        {bestDuo && (
          <HighlightCard
            icon={Users}
            label="Best Duo"
            value={bestDuo.names.join(" & ")}
            sub={`${Math.round(bestDuo.winRate * 100)}% WR in ${bestDuo.games} games`}
            color="bg-amber-500"
            delay={120}
          />
        )}
        {biggestRivalry && (
          <HighlightCard
            icon={Swords}
            label="Biggest Rivalry"
            value={biggestRivalry.names.join(" vs ")}
            sub={`${biggestRivalry.games} games against each other`}
            color="bg-red-500"
            delay={180}
          />
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 px-1">Player Stats</h2>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {sortedPlayers.map(p => (
            <button
              key={p.playerId}
              onClick={() => updateParams(activePlayerId === p.playerId ? null : p.playerId, seasonFilter)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activePlayerId === p.playerId
                  ? "bg-violet-500 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        {activePlayerStats ? (
          <PlayerDetail stats={activePlayerStats} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a player to see their stats</p>
          </div>
        )}
      </div>
    </div>
  );
}
