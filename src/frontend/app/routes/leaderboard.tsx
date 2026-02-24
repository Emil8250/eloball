import { useGetActiveSeasonQuery, useGetSeasonLeaderboardQuery, useGetPlayersQuery } from "../../apis/foosball/foosball";
import type { LeaderboardEntry } from "../../apis/foosball/types";
import { Link } from "react-router";
import { Swords, TrendingUp, Trophy, Gamepad2 } from "lucide-react";

const medals = ["🥇", "🥈", "🥉"];
const podiumColors = [
  "from-amber-400/20 to-yellow-200/30 border-amber-400/50",
  "from-slate-300/20 to-gray-200/30 border-slate-400/50",
  "from-orange-400/20 to-amber-200/30 border-orange-400/50",
];

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

  const isLoading = seasonLoading || playersLoading || lbLoading;

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

  const matchCount = season.isActive
    ? Math.floor((season as any).matches?.length ?? 0)
    : Math.floor((leaderboard?.reduce((sum, e) => sum + e.matchesPlayed, 0) ?? 0) / 2);
  const startDate = new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Season Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-bold mb-3">
          <Trophy size={14} />
          {season.name}
        </div>
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
              <div
                key={entry.playerId}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 bg-gradient-to-b ${podiumColors[1]} animate-slide-up w-28 sm:w-32`}
                style={{ animationDelay: "100ms" }}
              >
                <span className="text-2xl mb-1">{medals[1]}</span>
                <p className="font-extrabold text-sm truncate max-w-full">{entry.playerName}</p>
                <p className="text-xl font-black text-primary tabular-nums">
                  {entry.finalElo ?? entry.startingElo}
                </p>
                {entry.matchesPlayed > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {entry.matchesWon}W/{entry.matchesPlayed - entry.matchesWon}L
                  </div>
                )}
              </div>
            );
          })()}
          {/* 1st place — taller */}
          {(() => {
            const entry = leaderboard[0];
            return (
              <div
                key={entry.playerId}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 bg-gradient-to-b ${podiumColors[0]} animate-slide-up w-32 sm:w-36 -mt-4`}
                style={{ animationDelay: "0ms" }}
              >
                <span className="text-3xl mb-1">{medals[0]}</span>
                <p className="font-extrabold text-lg truncate max-w-full">{entry.playerName}</p>
                <p className="text-2xl font-black text-primary tabular-nums">
                  {entry.finalElo ?? entry.startingElo}
                </p>
                {entry.matchesPlayed > 0 && (
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>{entry.matchesWon}W/{entry.matchesPlayed - entry.matchesWon}L</span>
                    <span className="font-semibold">{Math.round(entry.winRate * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })()}
          {/* 3rd place */}
          {(() => {
            const entry = leaderboard[2];
            return (
              <div
                key={entry.playerId}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 bg-gradient-to-b ${podiumColors[2]} animate-slide-up w-28 sm:w-32`}
                style={{ animationDelay: "200ms" }}
              >
                <span className="text-2xl mb-1">{medals[2]}</span>
                <p className="font-extrabold text-sm truncate max-w-full">{entry.playerName}</p>
                <p className="text-xl font-black text-primary tabular-nums">
                  {entry.finalElo ?? entry.startingElo}
                </p>
                {entry.matchesPlayed > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {entry.matchesWon}W/{entry.matchesPlayed - entry.matchesWon}L
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Rest of leaderboard */}
      {leaderboard && leaderboard.length > 3 && (
        <div className="space-y-2">
          {leaderboard.slice(3).map((entry, i) => (
            <div
              key={entry.playerId}
              className="flex items-center gap-4 bg-card rounded-xl px-4 py-3 border border-border/50 animate-slide-up hover:border-primary/30 transition-colors"
              style={{ animationDelay: `${(i + 3) * 60}ms` }}
            >
              <span className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">
                {i + 4}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{entry.playerName}</p>
                {entry.matchesPlayed > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {entry.matchesWon}W / {entry.matchesPlayed - entry.matchesWon}L
                    <span className="ml-2 font-semibold">{Math.round(entry.winRate * 100)}%</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold tabular-nums">{entry.finalElo ?? entry.startingElo}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {leaderboard && leaderboard.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Gamepad2 size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No matches yet this season</p>
          <p className="text-sm mt-1">Start a game to see rankings!</p>
        </div>
      )}

      {/* Start Game — sticky at bottom of viewport, in flow after list */}
      <div className="sticky bottom-20 md:bottom-0 z-40 flex justify-center pt-8 pb-4 mt-2 bg-gradient-to-b from-transparent to-background">
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
