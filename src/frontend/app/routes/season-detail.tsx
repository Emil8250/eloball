import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useParams, Link } from "react-router";
import { useGetSeasonQuery, useGetSeasonLeaderboardQuery, useGetPlayerMatchesQuery } from "../../apis/foosball/foosball";
import type { LeaderboardEntry } from "../../apis/foosball/types";
import { computePlayerStats, classifyRank, PLACEMENT_GAMES } from "~/lib/playerStats";
import { useCurrentLeague } from "~/lib/useCurrentLeague";
import { ArrowLeft, Calendar, Gamepad2, Trophy } from "lucide-react";

const medals = ["🥇", "🥈", "🥉"];

export function meta() {
  return [{ title: "Eloball — Season Details" }];
}

function SecondarySection({ title, entries, seasonId, mode }: {
  title: string;
  entries: LeaderboardEntry[];
  seasonId: number;
  mode: "inactive" | "calibrating";
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden mt-4 opacity-60">
      <div className="px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{title}</h2>
      </div>
      <div className="divide-y divide-border/30">
        {entries.map((entry, i) => (
          <Link
            to={`/stats?player=${entry.playerId}&season=${seasonId}`}
            key={entry.playerId}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors animate-slide-up cursor-pointer"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="w-8 text-center text-xs shrink-0 text-muted-foreground tabular-nums">
              {mode === "calibrating" ? `${entry.matchesPlayed}/${PLACEMENT_GAMES}` : "💤"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{entry.playerName}</p>
              <p className="text-xs text-muted-foreground">
                {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                <span className="mx-1.5">·</span>
                {Math.round(entry.winRate * 100)}% WR
                <span className="mx-1.5">·</span>
                {entry.matchesPlayed} played
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold tabular-nums text-muted-foreground">{entry.latestElo ?? entry.startingElo}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SeasonDetail() {
  const { id } = useParams();
  const seasonId = Number(id);
  const leagueId = useCurrentLeague();
  const { data: season, isLoading: seasonLoading } = useGetSeasonQuery(seasonId);
  // PlayerSeason holds ratings for active seasons too, so fetch the leaderboard either way.
  const { data: seasonLeaderboard, isLoading: lbLoading } = useGetSeasonLeaderboardQuery(seasonId);
  const { data: allPlayerMatches } = useGetPlayerMatchesQuery(leagueId ?? skipToken);

  const isLoading = seasonLoading || lbLoading;

  // Compute W/L/played per player from match records (backend leaderboard stats are unreliable)
  const playerStats = useMemo(
    () => computePlayerStats(allPlayerMatches ?? [], seasonId),
    [allPlayerMatches, seasonId]
  );

  const withStats = (entry: LeaderboardEntry): LeaderboardEntry => {
    const s = playerStats.get(entry.playerId);
    return {
      ...entry,
      matchesPlayed: s?.matches ?? 0,
      matchesWon: s?.wins ?? 0,
      winRate: s?.winRate ?? 0,
    };
  };

  // Ratings come from PlayerSeason (active + ended); W/L recomputed from match records.
  const leaderboard: LeaderboardEntry[] | undefined = seasonLeaderboard?.map(withStats);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Gamepad2 size={40} className="text-primary animate-bounce" />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Season not found</p>
      </div>
    );
  }

  const startDate = new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const endDate = season.endDate
    ? new Date(season.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Present";

  const totalMatches = new Set(
    (allPlayerMatches ?? [])
      .filter(pm => pm.match.seasonId === seasonId)
      .map(pm => pm.matchId)
  ).size;

  // Split into ranked standings vs inactive / calibrating (CS-style). Only active
  // players make the final standings; activity is measured against the season's end
  // (or now, while it is still active).
  const refTime = season.isActive
    ? Date.now()
    : season.endDate ? new Date(season.endDate).getTime() : Date.now();
  const standings: LeaderboardEntry[] = [];
  const inactivePlayers: LeaderboardEntry[] = [];
  const calibratingPlayers: LeaderboardEntry[] = [];
  for (const entry of leaderboard ?? []) {
    if (entry.matchesPlayed === 0) continue; // non-participants don't appear
    const status = classifyRank(playerStats.get(entry.playerId), refTime);
    if (status === "calibrating") calibratingPlayers.push(entry);
    else if (status === "inactive") inactivePlayers.push(entry);
    else standings.push(entry);
  }
  const totalParticipants = standings.length + inactivePlayers.length + calibratingPlayers.length;

  // Group playerMatches by matchId for this season, then take latest 15, grouped by date
  const matchesByDate = (() => {
    if (!allPlayerMatches) return [];
    const forSeason = allPlayerMatches.filter(pm => pm.match.seasonId === seasonId);
    const grouped: Record<number, typeof forSeason> = {};
    for (const pm of forSeason) {
      (grouped[pm.matchId] ??= []).push(pm);
    }
    const matches = Object.values(grouped)
      .map(pms => ({
        id: pms[0].matchId,
        playerWonId: pms[0].match.playerWonId,
        createdDateTime: pms[0].match.createdDateTime,
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link to="/seasons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={16} />
        All Seasons
      </Link>

      {/* Season Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold">{season.name}</h1>
          {season.isActive && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Active
            </span>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {startDate} — {endDate}
          </span>
          <span className="flex items-center gap-1">
            <Trophy size={14} />
            {totalParticipants} players
          </span>
          {totalMatches > 0 && (
            <span className="flex items-center gap-1">
              <Gamepad2 size={14} />
              {totalMatches} matches
            </span>
          )}
        </div>
      </div>

      {/* Final standings — active/ranked players only */}
      {standings.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Standings</h2>
          </div>
          <div className="divide-y divide-border/30">
            {standings.map((entry, i) => {
              const finalElo = entry.latestElo ?? entry.startingElo;
              const eloChange = finalElo - entry.startingElo;
              return (
                <Link
                  to={`/stats?player=${entry.playerId}&season=${season.id}`}
                  key={entry.playerId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors animate-slide-up cursor-pointer"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="w-8 text-center text-sm">
                    {i < 3 ? medals[i] : <span className="text-muted-foreground font-bold tabular-nums">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{entry.playerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                      <span className="mx-1.5">·</span>
                      {Math.round(entry.winRate * 100)}% WR
                      <span className="mx-1.5">·</span>
                      {entry.matchesPlayed} played
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold tabular-nums">{finalElo}</p>
                    {eloChange !== 0 && !season.isActive && (
                      <p className={`text-xs font-bold tabular-nums ${eloChange > 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {eloChange > 0 ? "+" : ""}{eloChange}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Calibrating — fewer than the placement-game minimum */}
      {calibratingPlayers.length > 0 && (
        <SecondarySection
          title="Calibrating"
          entries={calibratingPlayers}
          seasonId={season.id}
          mode="calibrating"
        />
      )}

      {/* Inactive — not in the final standings (no recent activity) */}
      {inactivePlayers.length > 0 && (
        <SecondarySection
          title={season.isActive ? "Inactive — play to rejoin" : "Inactive — not in standings"}
          entries={inactivePlayers}
          seasonId={season.id}
          mode="inactive"
        />
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
                            <span className="text-xs text-muted-foreground font-bold">vs</span>
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
    </div>
  );
}
