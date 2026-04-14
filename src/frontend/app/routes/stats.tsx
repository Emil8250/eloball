import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useGetPlayerMatchesQuery, useGetSeasonsQuery } from "../../apis/foosball/foosball";
import type { PlayerMatchRecord } from "../../apis/foosball/types";
import { Gamepad2, Trophy, Swords, Users, Flame, Target, Shield, Heart, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  dayStats: Record<number, { wins: number; total: number }>;
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
          dayStats: {},
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

function computeWinRateProgression(records: PlayerMatchRecord[], playerId: number, seasonId?: number): { match: number; wr: number }[] {
  const matches = buildMatchesFromRecords(records, seasonId);
  const sorted = [...matches].sort(
    (a, b) => new Date(a[0].match.createdDateTime).getTime() - new Date(b[0].match.createdDateTime).getTime()
  );

  let wins = 0;
  let total = 0;
  const data: { match: number; wr: number }[] = [];

  for (const pms of sorted) {
    const pm = pms.find(p => p.playerId === playerId);
    if (!pm) continue;
    total++;
    if (pm.team === pms[0].match.playerWonId) wins++;
    data.push({ match: total, wr: Math.round((wins / total) * 100) });
  }

  return data;
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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function PlayerDetail({ stats, winRateData }: { stats: PlayerStats; winRateData: { match: number; wr: number }[] }) {
  const favoriteTeammate = Object.entries(stats.teammates)
    .sort((a, b) => b[1].games - a[1].games)[0];
  const bestTeammate = Object.entries(stats.teammates)
    .filter(([, v]) => v.games >= 2)
    .sort((a, b) => (b[1].wins / b[1].games) - (a[1].wins / a[1].games))[0];
  const nemesis = Object.entries(stats.opponents)
    .sort((a, b) => b[1].lossesTo - a[1].lossesTo)[0];
  const victim = Object.entries(stats.opponents)
    .sort((a, b) => b[1].winsOver - a[1].winsOver)[0];

  const eligibleDays = Object.entries(stats.dayStats)
    .filter(([, v]) => v.total >= 3)
    .map(([day, v]) => ({ day: Number(day), wr: v.wins / v.total, ...v }));
  const bestDay = eligibleDays.length >= 2
    ? eligibleDays.sort((a, b) => b.wr - a.wr)[0] : null;

  const h2h = Object.entries(stats.opponents)
    .sort((a, b) => b[1].games - a[1].games);

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
        {bestDay && (
          <StatRow
            icon={Calendar}
            iconColor="text-emerald-500"
            label="Best day"
            value={DAY_NAMES[bestDay.day]}
            sub={`${Math.round(bestDay.wr * 100)}% WR in ${bestDay.total} games`}
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
        {winRateData.length > 5 && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Win Rate Over Time</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={winRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value}%`, "Win Rate"]}
                  labelFormatter={(label) => `Match ${label}`}
                />
                <Line type="monotone" dataKey="wr" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {h2h.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Swords size={14} className="text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Head to Head</span>
            </div>
            <div className="space-y-1.5">
              {h2h.map(([name, record]) => {
                const wr = record.games > 0 ? record.winsOver / record.games : 0;
                return (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-medium truncate">{name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {record.winsOver}W / {record.lossesTo}L
                    </span>
                    <span className={`text-xs font-semibold tabular-nums w-10 text-right ${wr >= 0.5 ? "text-emerald-500" : "text-red-400"}`}>
                      {Math.round(wr * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
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

  const winRateData = useMemo(
    () => allRecords && activePlayerId
      ? computeWinRateProgression(allRecords, activePlayerId, seasonFilter ?? undefined)
      : [],
    [allRecords, activePlayerId, seasonFilter]
  );

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
          <PlayerDetail stats={activePlayerStats} winRateData={winRateData} />
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
