import { useState } from "react";
import { useGetActiveSeasonQuery, useGetSeasonLeaderboardQuery, useGetPlayersQuery, useGetPlayerMatchesQuery } from "../../apis/foosball/foosball";
import type { LeaderboardEntry } from "../../apis/foosball/types";
import { computePlayerStats, classifyRank, PLACEMENT_GAMES } from "~/lib/playerStats";
import { Link } from "react-router";
import { Swords, TrendingUp, Trophy, Gamepad2 } from "lucide-react";

const medals = ["🥇", "🥈", "🥉"];
const podiumColors = [
  "from-amber-400/20 to-yellow-200/30 border-amber-400/50",
  "from-slate-300/20 to-gray-200/30 border-slate-400/50",
  "from-orange-400/20 to-amber-200/30 border-orange-400/50",
];

function EloValue({ value, enabled }: { value: number; enabled: boolean }) {
  const valueText = value.toString();

  if (!enabled) {
    return <>{valueText}</>;
  }

  return (
    <>
      {valueText.split(/(69)/g).map((part, index) =>
        part === "69" ? (
          <span
            key={index}
            className="inline-block bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export function meta() {
  return [{ title: "Eloball — Leaderboard" }];
}

export default function Leaderboard() {  
  const { data: season, isLoading: seasonLoading } = useGetActiveSeasonQuery();
  const { data: players, isLoading: playersLoading } = useGetPlayersQuery();
  const { data: seasonLeaderboard, isLoading: lbLoading } = useGetSeasonLeaderboardQuery(
    season?.id ?? 0,
    { skip: !season?.id || season?.isActive }
  );  
  const { data: allPlayerMatches } = useGetPlayerMatchesQuery();
  const [seasonNameClickCount, setSeasonNameClickCount] = useState(0);
  const isLoading = seasonLoading || playersLoading || lbLoading;

  // For the active season, partition players (who have played this season) into
  // ranked / inactive / calibrating, CS-style — purely a display split, ratings untouched.
  const byElo = (a: LeaderboardEntry, b: LeaderboardEntry) =>
    (b.finalElo ?? 0) - (a.finalElo ?? 0);
  const { activeLeaderboard, inactiveLeaderboard, calibrating } = (() => {
    const empty = {
      activeLeaderboard: [] as LeaderboardEntry[],
      inactiveLeaderboard: [] as LeaderboardEntry[],
      calibrating: [] as LeaderboardEntry[],
    };
    if (!season?.isActive || !players || !allPlayerMatches) return empty;

    const stats = computePlayerStats(allPlayerMatches, season.id);
    const eloById = new Map(players.map(p => [p.id, p.elo]));
    const now = Date.now();
    const calibrating: LeaderboardEntry[] = [];
    const inactiveLeaderboard: LeaderboardEntry[] = [];
    const activeLeaderboard: LeaderboardEntry[] = [];
    for (const s of stats.values()) {
      const entry: LeaderboardEntry = {
        playerId: s.playerId,
        playerName: s.name,
        startingElo: 1000,
        finalElo: eloById.get(s.playerId) ?? null,
        matchesPlayed: s.matches,
        matchesWon: s.wins,
        winRate: s.winRate,
      };
      const status = classifyRank(s, now);
      if (status === "calibrating") calibrating.push(entry);
      else if (status === "inactive") inactiveLeaderboard.push(entry);
      else activeLeaderboard.push(entry);
    }
    calibrating.sort(byElo);
    inactiveLeaderboard.sort(byElo);
    activeLeaderboard.sort(byElo);
    return { activeLeaderboard, inactiveLeaderboard, calibrating };
  })();

  // Active season → ranked list only; ended season → backend leaderboard as-is.
  const leaderboard: LeaderboardEntry[] | undefined = season?.isActive
    ? activeLeaderboard
    : seasonLeaderboard;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Gamepad2 size={40} className="text-primary animate-bounce" />
          <p className="text-muted-foreground font-medium">Loading scores...</p>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Trophy size={48} className="mx-auto text-muted-foreground/50" />
          <p className="text-lg font-semibold text-muted-foreground">No active season</p>
          <p className="text-sm text-muted-foreground/70">Create a season to start tracking scores</p>
        </div>
      </div>
    );
  }

  // Group playerMatches by matchId for this season, then take latest 15
  const matchesByDate = (() => {
    if (!allPlayerMatches || !season) return [];
    const forSeason = allPlayerMatches.filter(pm => pm.match.seasonId === season.id);
    const grouped: Record<number, typeof forSeason> = {};
    for (const pm of forSeason) {
      (grouped[pm.matchId] ??= []).push(pm);
    }
    const matches = Object.values(grouped)
      .map(pms => ({
        id: pms[0].matchId,
        playerWonId: pms[0].match.playerWonId,
        createdDateTime: pms[0].match.createdDateTime,
        egg: pms[0].match.egg,
        players: pms,
      }))
      .sort((a, b) => new Date(b.createdDateTime).getTime() - new Date(a.createdDateTime).getTime())
      .slice(0, 15);

    const byDate: { date: string; matches: typeof matches }[] = [];
    for (const match of matches) {
      const dateKey = new Date(match.createdDateTime).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      });
      const last = byDate[byDate.length - 1];
      if (last?.date === dateKey) {
        last.matches.push(match);
      } else {
        byDate.push({ date: dateKey, matches: [match] });
      }
    }
    return byDate;
  })();

  // Eggs delivered (won a 10-0 shutout) per player, this season
  const eggsByPlayer = (() => {
    const map = new Map<number, number>();
    if (!allPlayerMatches) return map;
    for (const pm of allPlayerMatches) {
      if (pm.match.seasonId === season.id && pm.match.egg && pm.team === pm.match.playerWonId) {
        map.set(pm.playerId, (map.get(pm.playerId) ?? 0) + 1);
      }
    }
    return map;
  })();

  const matchCount = new Set(
    (allPlayerMatches ?? [])
      .filter(pm => pm.match.seasonId === season.id)
      .map(pm => pm.matchId)
  ).size;
  const startDate = new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const isEasterEggActive = seasonNameClickCount >= 10;

const handleSeasonNameClick = () => {
  setSeasonNameClickCount(currentCount => currentCount + 1);
};

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Season Header */}
      <div className="text-center mb-8">
        <button
          type="button"
          onClick={handleSeasonNameClick}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-bold mb-3"
        >
          <Trophy size={14} />
          {season.name}
        </button>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gamepad2 size={14} />
            {matchCount} matches
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={14} />
            Since {startDate}
          </span>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6">
          {/* 2nd place */}
          {(() => {
            const entry = leaderboard[1];
            return (
              <Link
                to={`/stats?player=${entry.playerId}${season ? `&season=${season.id}` : ""}`}
                key={entry.playerId}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 bg-gradient-to-b ${podiumColors[1]} animate-slide-up w-28 sm:w-32 cursor-pointer hover:scale-105 transition-transform`}
                style={{ animationDelay: "100ms" }}
              >
                <span className="text-2xl mb-1">{medals[1]}</span>
                <p className="font-extrabold text-sm truncate max-w-full">{entry.playerName}</p>
                {(eggsByPlayer.get(entry.playerId) ?? 0) > 0 && (
                  <span className="text-[11px] font-bold leading-none mt-0.5" title="Eggs delivered (10-0)">🥚 {eggsByPlayer.get(entry.playerId)}</span>
                )}
                <p className="text-xl font-black text-primary tabular-nums">
                  {/* {entry.finalElo ?? entry.startingElo} */}
                  <EloValue value={entry.finalElo ?? entry.startingElo} enabled={isEasterEggActive} />
                </p>
                {entry.matchesPlayed > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {entry.matchesWon}W/{entry.matchesPlayed - entry.matchesWon}L
                  </div>
                )}
              </Link>
            );
          })()}
          {/* 1st place — taller */}
          {(() => {
            const entry = leaderboard[0];
            return (
              <Link
                to={`/stats?player=${entry.playerId}${season ? `&season=${season.id}` : ""}`}
                key={entry.playerId}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 bg-gradient-to-b ${podiumColors[0]} animate-slide-up w-32 sm:w-36 -mt-4 cursor-pointer hover:scale-105 transition-transform`}
                style={{ animationDelay: "0ms" }}
              >
                <span className="text-3xl mb-1">{medals[0]}</span>
                <p className="font-extrabold text-lg truncate max-w-full">{entry.playerName}</p>
                {(eggsByPlayer.get(entry.playerId) ?? 0) > 0 && (
                  <span className="text-xs font-bold leading-none mt-0.5" title="Eggs delivered (10-0)">🥚 {eggsByPlayer.get(entry.playerId)}</span>
                )}
                <p className="text-2xl font-black text-primary tabular-nums">
                  <EloValue value={entry.finalElo ?? entry.startingElo} enabled={isEasterEggActive} />
                </p>
                {entry.matchesPlayed > 0 && (
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>{entry.matchesWon}W/{entry.matchesPlayed - entry.matchesWon}L</span>
                    <span className="font-semibold">{Math.round(entry.winRate * 100)}%</span>
                  </div>
                )}
              </Link>
            );
          })()}
          {/* 3rd place */}
          {(() => {
            const entry = leaderboard[2];
            return (
              <Link
                to={`/stats?player=${entry.playerId}${season ? `&season=${season.id}` : ""}`}
                key={entry.playerId}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 bg-gradient-to-b ${podiumColors[2]} animate-slide-up w-28 sm:w-32 cursor-pointer hover:scale-105 transition-transform`}
                style={{ animationDelay: "200ms" }}
              >
                <span className="text-2xl mb-1">{medals[2]}</span>
                <p className="font-extrabold text-sm truncate max-w-full">{entry.playerName}</p>
                {(eggsByPlayer.get(entry.playerId) ?? 0) > 0 && (
                  <span className="text-[11px] font-bold leading-none mt-0.5" title="Eggs delivered (10-0)">🥚 {eggsByPlayer.get(entry.playerId)}</span>
                )}
                <p className="text-xl font-black text-primary tabular-nums">
                  <EloValue value={entry.finalElo ?? entry.startingElo} enabled={isEasterEggActive} />
                </p>
                {entry.matchesPlayed > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {entry.matchesWon}W/{entry.matchesPlayed - entry.matchesWon}L
                  </div>
                )}
              </Link>
            );
          })()}
        </div>
      )}

      {/* Rest of leaderboard — below the podium, or all ranked players when there's no full podium */}
      {leaderboard && leaderboard.length > 0 && (() => {
        const hasPodium = leaderboard.length >= 3;
        const rest = hasPodium ? leaderboard.slice(3) : leaderboard;
        const baseRank = hasPodium ? 4 : 1;
        if (rest.length === 0) return null;
        return (
        <div className="space-y-2">
          {rest.map((entry, i) => (
            <Link
              to={`/stats?player=${entry.playerId}${season ? `&season=${season.id}` : ""}`}
              key={entry.playerId}
              className="flex items-center gap-4 bg-card rounded-xl px-4 py-3 border border-border/50 animate-slide-up hover:border-primary/30 transition-colors cursor-pointer"
              style={{ animationDelay: `${(i + 3) * 60}ms` }}
            >
              <span className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">
                {baseRank + i}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate flex items-center gap-1.5">
                  <span className="truncate">{entry.playerName}</span>
                  {(eggsByPlayer.get(entry.playerId) ?? 0) > 0 && (
                    <span className="text-xs font-bold shrink-0" title="Eggs delivered (10-0)">🥚 {eggsByPlayer.get(entry.playerId)}</span>
                  )}
                </p>
                {entry.matchesPlayed > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                    <span className="ml-2 font-semibold">{Math.round(entry.winRate * 100)}%</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold tabular-nums"><EloValue value={entry.finalElo ?? entry.startingElo} enabled={isEasterEggActive} /></p>
              </div>
            </Link>
          ))}
        </div>
        );
      })()}

      {/* Calibrating — not yet ranked (placement matches) */}
      {calibrating.length > 0 && (
        <div className="mt-6">
          <div className="px-1 mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Calibrating</h2>
          </div>
          <div className="space-y-2">
            {calibrating.map((entry, i) => (
              <Link
                to={`/stats?player=${entry.playerId}${season ? `&season=${season.id}` : ""}`}
                key={entry.playerId}
                className="flex items-center gap-4 bg-card rounded-xl px-4 py-3 border border-border/50 opacity-70 animate-slide-up hover:border-primary/30 transition-colors cursor-pointer"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-[11px] font-bold text-muted-foreground w-8 text-center tabular-nums shrink-0">
                  {entry.matchesPlayed}/{PLACEMENT_GAMES}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate flex items-center gap-1.5">
                    <span className="truncate">{entry.playerName}</span>
                    {(eggsByPlayer.get(entry.playerId) ?? 0) > 0 && (
                      <span className="text-xs font-bold shrink-0" title="Eggs delivered (10-0)">🥚 {eggsByPlayer.get(entry.playerId)}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                    <span className="ml-2">{PLACEMENT_GAMES - entry.matchesPlayed} more to rank</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold tabular-nums text-muted-foreground">{entry.finalElo ?? entry.startingElo}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inactive — ranked players who haven't played recently; rating parked */}
      {inactiveLeaderboard.length > 0 && (
        <div className="mt-6">
          <div className="px-1 mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Inactive — play to rejoin</h2>
          </div>
          <div className="space-y-2">
            {inactiveLeaderboard.map((entry, i) => (
              <Link
                to={`/stats?player=${entry.playerId}${season ? `&season=${season.id}` : ""}`}
                key={entry.playerId}
                className="flex items-center gap-4 bg-card rounded-xl px-4 py-3 border border-border/50 opacity-60 animate-slide-up hover:border-primary/30 transition-colors cursor-pointer"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="w-6 text-center shrink-0" title="Inactive">💤</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate flex items-center gap-1.5">
                    <span className="truncate">{entry.playerName}</span>
                    {(eggsByPlayer.get(entry.playerId) ?? 0) > 0 && (
                      <span className="text-xs font-bold shrink-0" title="Eggs delivered (10-0)">🥚 {eggsByPlayer.get(entry.playerId)}</span>
                    )}
                  </p>
                  {entry.matchesPlayed > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                      <span className="ml-2 font-semibold">{Math.round(entry.winRate * 100)}%</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold tabular-nums text-muted-foreground">{entry.finalElo ?? entry.startingElo}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {leaderboard && leaderboard.length === 0 && calibrating.length === 0 && inactiveLeaderboard.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Gamepad2 size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No matches yet this season</p>
          <p className="text-sm mt-1">Start a game to see rankings!</p>
        </div>
      )}

      {/* Recent Matches */}
      {matchesByDate.length > 0 && (
        <div className="mt-6">
          <div className="px-1 mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Recent Matches</h2>
          </div>
          <div className="space-y-4">
            {matchesByDate.map(group => (
              <div key={group.date}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{group.date}</p>
                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
                  {group.matches.map((match, i) => {
                    const team1 = match.players.filter(pm => pm.team === 1);
                    const team2 = match.players.filter(pm => pm.team === 2);
                    const winningTeam = match.playerWonId;

                    return (
                      <div
                        key={match.id}
                        className="px-4 py-3 animate-slide-up"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-1 text-right ${winningTeam === 1 ? "font-bold" : "text-muted-foreground"}`}>
                            <p className="text-sm flex items-center justify-end gap-1.5">
                              {winningTeam === 1 && <Trophy size={12} className="text-amber-500 shrink-0" />}
                              {team1.map(pm => pm.player.name).join(" & ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`w-2 h-2 rounded-full ${winningTeam === 1 ? "bg-team-red" : "bg-team-red/30"}`} />
                            {match.egg
                              ? <span className="text-xs" title="Egg — 10-0 shutout">🥚</span>
                              : <span className="text-xs text-muted-foreground font-bold">vs</span>}
                            <span className={`w-2 h-2 rounded-full ${winningTeam === 2 ? "bg-team-blue" : "bg-team-blue/30"}`} />
                          </div>
                          <div className={`flex-1 ${winningTeam === 2 ? "font-bold" : "text-muted-foreground"}`}>
                            <p className="text-sm flex items-center gap-1.5">
                              {team2.map(pm => pm.player.name).join(" & ")}
                              {winningTeam === 2 && <Trophy size={12} className="text-amber-500 shrink-0" />}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Game — sticky at bottom of viewport, in flow after list */}
      <div className="sticky bottom-20 md:bottom-0 z-40 flex justify-center pt-8 pb-4 mt-2 md:bg-gradient-to-b md:from-transparent md:to-background">
        <Link
          to="/game"
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-8 py-3 font-bold shadow-lg shadow-orange-500/25 inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <Swords size={20} />
          Start Game
        </Link>
      </div>
    </div>
  );
}
