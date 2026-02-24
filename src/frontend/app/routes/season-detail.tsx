import { useParams, Link } from "react-router";
import { useGetSeasonQuery, useGetSeasonLeaderboardQuery, useGetPlayersQuery } from "../../apis/foosball/foosball";
import type { LeaderboardEntry } from "../../apis/foosball/types";
import { ArrowLeft, Calendar, Gamepad2, Trophy } from "lucide-react";

const medals = ["🥇", "🥈", "🥉"];

export function meta() {
  return [{ title: "Eloball — Season Details" }];
}

export default function SeasonDetail() {
  const { id } = useParams();
  const seasonId = Number(id);
  const { data: season, isLoading: seasonLoading } = useGetSeasonQuery(seasonId);
  const { data: seasonLeaderboard, isLoading: lbLoading } = useGetSeasonLeaderboardQuery(seasonId, {
    skip: season?.isActive,
  });
  const { data: players, isLoading: playersLoading } = useGetPlayersQuery(undefined, {
    skip: !season?.isActive,
  });

  const isLoading = seasonLoading || lbLoading || playersLoading;

  // For active season, build leaderboard from player data
  const leaderboard: LeaderboardEntry[] | undefined = season?.isActive && players
    ? [...players]
        .sort((a, b) => b.elo - a.elo)
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          startingElo: 1000,
          finalElo: p.elo,
          matchesPlayed: 0,
          matchesWon: 0,
          winRate: 0,
        }))
    : seasonLeaderboard;

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

  const totalMatches = leaderboard ? Math.round(leaderboard.reduce((sum, e) => sum + e.matchesPlayed, 0) / 2) : 0;

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
            {leaderboard?.length ?? 0} players
          </span>
          {totalMatches > 0 && (
            <span className="flex items-center gap-1">
              <Gamepad2 size={14} />
              {totalMatches} matches
            </span>
          )}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Leaderboard</h2>
          </div>
          <div className="divide-y divide-border/30">
            {leaderboard.map((entry, i) => {
              const finalElo = entry.finalElo ?? entry.startingElo;
              const eloChange = finalElo - entry.startingElo;
              return (
                <div
                  key={entry.playerId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="w-8 text-center text-sm">
                    {i < 3 ? medals[i] : <span className="text-muted-foreground font-bold tabular-nums">{i + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{entry.playerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.matchesPlayed > 0 ? (
                        <>
                          {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                          <span className="mx-1.5">·</span>
                          {Math.round(entry.winRate * 100)}% WR
                          <span className="mx-1.5">·</span>
                          {entry.matchesPlayed} played
                        </>
                      ) : (
                        "No matches recorded"
                      )}
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
