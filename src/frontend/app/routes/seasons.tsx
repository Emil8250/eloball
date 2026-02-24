import { useGetSeasonsQuery, useGetSeasonLeaderboardQuery, useGetActiveSeasonQuery, useEndSeasonMutation, useCreateSeasonMutation } from "../../apis/foosball/foosball";
import { Link } from "react-router";
import { Calendar, Crown, Trophy, ChevronRight, Gamepad2, TrendingUp } from "lucide-react";
import type { LeaderboardEntry, Season } from "../../apis/foosball/types";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "~/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function meta() {
  return [{ title: "Eloball — Seasons" }];
}

const chartColors = [
  "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

function SeasonCard({ season }: { season: Season }) {
  const { data: leaderboard } = useGetSeasonLeaderboardQuery(season.id);

  const startDate = new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const endDate = season.endDate
    ? new Date(season.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Present";

  const winner = leaderboard?.[0];
  const podium = leaderboard?.slice(0, 3) ?? [];
  const totalMatches = leaderboard?.reduce((sum, e) => sum + e.matchesPlayed, 0) ?? 0;

  return (
    <Link
      to={`/seasons/${season.id}`}
      className="block bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-extrabold text-lg">{season.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Calendar size={11} className="inline mr-1" />
            {startDate} — {endDate}
          </p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
      </div>

      {/* Winner */}
      {winner && (
        <div className="flex items-center gap-2 mb-3 bg-amber-50/80 dark:bg-amber-500/10 rounded-xl px-3 py-2">
          <Crown size={16} className="text-amber-500" />
          <span className="font-bold text-sm">{winner.playerName}</span>
          <span className="text-sm font-extrabold text-primary ml-auto tabular-nums">
            {winner.finalElo ?? winner.startingElo}
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Trophy size={12} />
          {leaderboard?.length ?? 0} players
        </span>
        {totalMatches > 0 && (
          <span className="flex items-center gap-1">
            <Gamepad2 size={12} />
            {Math.round(totalMatches / 2)} matches
          </span>
        )}
      </div>

      {/* Mini podium */}
      {podium.length > 0 && (
        <div className="flex gap-1 mt-3">
          {podium.map((entry, i) => (
            <div
              key={entry.playerId}
              className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1 text-xs"
            >
              <span>{["🥇", "🥈", "🥉"][i]}</span>
              <span className="font-semibold truncate max-w-[70px]">{entry.playerName}</span>
              {entry.finalElo && (
                <span className="text-muted-foreground tabular-nums">{entry.finalElo}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

function ActiveSeasonBanner({ season }: { season: Season }) {
  return (
    <Link
      to="/"
      className="block bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5 rounded-2xl border border-emerald-500/20 p-5 hover:border-emerald-500/40 transition-all group mb-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg">{season.name}</h3>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Calendar size={11} className="inline mr-1" />
            Started {new Date(season.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            View current leaderboard →
          </p>
        </div>
        <ChevronRight size={18} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform mt-1" />
      </div>
    </Link>
  );
}

function EloHistoryChart({ seasons, pastSeasons }: { seasons: Season[]; pastSeasons: Season[] }) {
  // Fetch leaderboards for all past seasons
  const leaderboardQueries = pastSeasons.map(s => useGetSeasonLeaderboardQuery(s.id));
  const allLoaded = leaderboardQueries.every(q => q.data !== undefined);

  if (!allLoaded || pastSeasons.length < 1) return null;

  // Collect all unique player names
  const playerSet = new Set<string>();
  leaderboardQueries.forEach(q => {
    q.data?.forEach(e => playerSet.add(e.playerName));
  });
  const allPlayers = Array.from(playerSet);

  // Build chart data: one point per season (chronological order)
  const orderedPastSeasons = [...pastSeasons].reverse(); // oldest first
  const orderedQueries = [...leaderboardQueries].reverse();

  const chartData = orderedPastSeasons.map((season, i) => {
    const lb = orderedQueries[i].data ?? [];
    const point: Record<string, string | number> = { name: season.name };
    lb.forEach(entry => {
      if (entry.finalElo != null) {
        point[entry.playerName] = entry.finalElo;
      }
    });
    return point;
  });

  if (chartData.length < 1) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-primary" />
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">ELO Over Seasons</h2>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={['dataMin - 30', 'dataMax + 30']} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          {allPlayers.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={chartColors[i % chartColors.length]}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const adjectives = [
  "Shadow", "Phantom", "Stealth", "Rogue", "Cipher", "Crypto", "Binary",
  "Quantum", "Zero-Day", "Kernel", "Firewall", "Daemon", "Rootkit", "Brute",
  "Covert", "Silent", "Dark", "Iron", "Neon", "Obsidian", "Recursive",
  "Volatile", "Encrypted", "Forbidden", "Overclocked", "Reckless",
];

const nouns = [
  "Protocol", "Exploit", "Payload", "Fortress", "Breach", "Vector", "Epoch",
  "Overflow", "Heist", "Siege", "Recon", "Ops", "Cipher", "Blitz",
  "Takedown", "Lockdown", "Uprising", "Showdown", "Gambit", "Offensive",
  "Onslaught", "Incursion", "Mandate", "Endgame", "Override",
];

function generateSeasonName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export default function Seasons() {
  const { data: seasons, isLoading } = useGetSeasonsQuery();
  const { data: activeSeason } = useGetActiveSeasonQuery();
  const [endSeason] = useEndSeasonMutation();
  const [createSeason] = useCreateSeasonMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStartNewSeason = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    if (activeSeason) {
      try {
        await endSeason(activeSeason.id).unwrap();
      } catch {
        toast.error("Failed to end current season.");
        setSubmitting(false);
        return;
      }
    }
    try {
      await createSeason({ name: newName.trim() }).unwrap();
      toast.success(`New season "${newName.trim()}" started!`);
      setDialogOpen(false);
      setNewName("");
    } catch {
      toast.error("Season ended but failed to create new one. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Gamepad2 size={40} className="text-primary animate-bounce" />
      </div>
    );
  }

  const pastSeasons = seasons?.filter(s => !s.isActive) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-center mb-6">Seasons</h1>

      {/* Active season banner — links to leaderboard */}
      {activeSeason && <ActiveSeasonBanner season={activeSeason} />}

      {/* ELO over seasons chart */}
      {seasons && pastSeasons.length > 0 && (
        <EloHistoryChart seasons={seasons} pastSeasons={pastSeasons} />
      )}

      {/* Past seasons list */}
      {pastSeasons.length > 0 ? (
        <div className="space-y-3">
          {pastSeasons.map((season, i) => (
            <div key={season.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <SeasonCard season={season} />
            </div>
          ))}
        </div>
      ) : (
        !activeSeason && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-semibold">No seasons yet</p>
          </div>
        )
      )}

      {/* Start New Season — sticky at bottom */}
      <div className="sticky bottom-20 md:bottom-0 z-40 flex justify-center pt-8 pb-4 mt-2 bg-gradient-to-b from-transparent to-background">
        <button
          onClick={() => { setNewName(generateSeasonName()); setDialogOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-3 font-bold shadow-lg shadow-emerald-600/25 inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <Calendar size={20} />
          Start New Season
        </button>
      </div>

      {/* New Season Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Season</DialogTitle>
            <DialogDescription>
              {activeSeason
                ? <>This will end <strong>{activeSeason.name}</strong>, save all player stats, and reset everyone's ELO to 1000.</>
                : "This will create a new active season."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-semibold text-muted-foreground block mb-2">New Season Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Shadow Protocol"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={submitting}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleStartNewSeason} disabled={submitting || !newName.trim()}>
              {submitting ? "Starting..." : "Start Season"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
