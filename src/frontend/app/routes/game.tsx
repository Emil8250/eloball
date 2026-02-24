import { useGetPlayersQuery, usePostMatchMutation } from "../../apis/foosball/foosball";
import type { Match, PlayerTeam } from "../../apis/foosball/types";
import usePlayerContext from "~/context/PlayerContext/usePlayerContext";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ArrowLeftRight, Scale, X, Gamepad2, Trophy } from "lucide-react";

export function meta() {
  return [{ title: "Eloball — Play" }];
}

function eloBadgeColor(elo: number): string {
  if (elo >= 1100) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/30";
  if (elo >= 1050) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-400/30";
  if (elo >= 1000) return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-400/30";
  if (elo >= 950) return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-400/30";
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-400/30";
}

function eloBadgeOnDark(elo: number): string {
  if (elo >= 1100) return "bg-amber-500 text-white border-amber-400";
  if (elo >= 1050) return "bg-emerald-500 text-white border-emerald-400";
  if (elo >= 1000) return "bg-blue-500 text-white border-blue-400";
  if (elo >= 950) return "bg-slate-500 text-white border-slate-400";
  return "bg-red-500 text-white border-red-400";
}

export default function Game() {
  const { data: players, isLoading: playersLoading } = useGetPlayersQuery();
  const { players: selected, addPlayer, removePlayer } = usePlayerContext();
  const [postMatch, { isLoading: submitting, isSuccess }] = usePostMatchMutation();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Match recorded! ELO updated.");
      selected.forEach(p => removePlayer(p.player.id));
    }
  }, [isSuccess]);

  const team1 = selected.filter(p => p.team === 1);
  const team2 = selected.filter(p => p.team === 2);
  const canSubmit = team1.length > 0 && team2.length > 0 && selected.length >= 2;
  const canCalibrate = selected.length >= 3 && selected.length <= 4;

  const isSelected = (id: number) => selected.some(p => p.player.id === id);

  const addToTeam = (player: { id: number; name: string; elo: number }, team: number) => {
    if (isSelected(player.id)) {
      // If already selected, switch team
      removePlayer(player.id);
    }
    const teamPlayers = team === 1 ? team1 : team2;
    if (teamPlayers.length >= 2) {
      toast.warning(`Team ${team === 1 ? "Red" : "Blue"} is full`);
      return;
    }
    if (selected.length >= 4 && !isSelected(player.id)) {
      toast.warning("Maximum 4 players per match");
      return;
    }
    addPlayer({ player, team });
  };

  const calibrateTeams = useCallback(() => {
    if (!canCalibrate) return;
    const sorted = [...selected].sort((a, b) => a.player.elo - b.player.elo);
    let updated: PlayerTeam[] = [];

    if (selected.length === 4) {
      updated = [
        { ...sorted[3], team: 1 }, { ...sorted[0], team: 1 },
        { ...sorted[1], team: 2 }, { ...sorted[2], team: 2 },
      ];
    } else {
      updated = [
        { ...sorted[2], team: 1 },
        { ...sorted[0], team: 2 }, { ...sorted[1], team: 2 },
      ];
    }
    selected.forEach(p => removePlayer(p.player.id));
    updated.forEach(p => addPlayer(p));
    toast.success("Teams balanced!");
  }, [selected, removePlayer, addPlayer, canCalibrate]);

  const swapTeams = useCallback(() => {
    if (selected.length < 2) return;
    const updated = selected.map(p => ({ ...p, team: p.team === 1 ? 2 : 1 }));
    selected.forEach(p => removePlayer(p.player.id));
    updated.forEach(p => addPlayer(p));
  }, [selected, removePlayer, addPlayer]);

  const handleSubmit = (teamWonId: number) => {
    const matches: Match[] = selected.map(p => ({
      playerId: p.player.id,
      teamId: p.team
    }));
    if (canSubmit) {
      postMatch({ matches, teamWonId });
    }
  };

  if (playersLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Gamepad2 size={40} className="text-primary animate-bounce" />
      </div>
    );
  }

  const sortedPlayers = players ? [...players].sort((a, b) => a.name.localeCompare(b.name)) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Foosball-style header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold">New Match</h1>
        <p className="text-xs text-muted-foreground mt-1">Select players and assign teams</p>
      </div>

      {/* Team Display — Bonzini-inspired with wood/green field vibe */}
      <div className="rounded-2xl bg-gradient-to-b from-emerald-800 to-emerald-900 p-4 mb-4 shadow-lg relative overflow-hidden">
        {/* Field lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-full bg-white/10"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10 pointer-events-none"></div>

        <div className="grid grid-cols-2 gap-3 relative">
          {/* Team Red */}
          <div>
            <h3 className="font-extrabold text-sm text-red-300 mb-2 text-center uppercase tracking-wider">Team Red</h3>
            <div className="space-y-2">
              {[0, 1].map(slot => {
                const p = team1[slot];
                return (
                  <div key={`r${slot}`} className={`rounded-xl p-3 h-[66px] flex items-center transition-all ${
                    p
                      ? "bg-red-500/25 border border-red-400/40 backdrop-blur-sm"
                      : "border border-dashed border-white/15"
                  }`}>
                    {p ? (
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-bold text-sm text-white">{p.player.name}</p>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${eloBadgeOnDark(p.player.elo)}`}>
                            {p.player.elo}
                          </span>
                        </div>
                        <button onClick={() => removePlayer(p.player.id)} className="text-white/40 hover:text-white p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-white/25 mx-auto">Player {slot + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Blue */}
          <div>
            <h3 className="font-extrabold text-sm text-blue-300 mb-2 text-center uppercase tracking-wider">Team Blue</h3>
            <div className="space-y-2">
              {[0, 1].map(slot => {
                const p = team2[slot];
                return (
                  <div key={`b${slot}`} className={`rounded-xl p-3 h-[66px] flex items-center transition-all ${
                    p
                      ? "bg-blue-500/25 border border-blue-400/40 backdrop-blur-sm"
                      : "border border-dashed border-white/15"
                  }`}>
                    {p ? (
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-bold text-sm text-white">{p.player.name}</p>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${eloBadgeOnDark(p.player.elo)}`}>
                            {p.player.elo}
                          </span>
                        </div>
                        <button onClick={() => removePlayer(p.player.id)} className="text-white/40 hover:text-white p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-white/25 mx-auto">Player {slot + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions inside the field */}
        <div className="flex gap-2 mt-3 relative">
          <Button
            onClick={calibrateTeams}
            disabled={!canCalibrate || submitting}
            className="flex-1 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold border-0 backdrop-blur-sm"
          >
            <Scale size={16} className="mr-1.5" />
            Calibrate
          </Button>
          <Button
            onClick={swapTeams}
            disabled={selected.length < 2 || submitting}
            className="rounded-xl bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
          >
            <ArrowLeftRight size={16} />
          </Button>
        </div>
      </div>

      {/* Post Match — Red Won / Blue Won */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Button
          onClick={() => handleSubmit(1)}
          disabled={!canSubmit || submitting}
          className="rounded-2xl py-5 text-base font-extrabold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all active:scale-95"
        >
          <Trophy size={18} className="mr-2" />
          Red Won
        </Button>
        <Button
          onClick={() => handleSubmit(2)}
          disabled={!canSubmit || submitting}
          className="rounded-2xl py-5 text-base font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <Trophy size={18} className="mr-2" />
          Blue Won
        </Button>
      </div>

      {/* Player Selection Grid */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Select Players</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedPlayers.map(player => {
            const sel = isSelected(player.id);
            const teamEntry = selected.find(p => p.player.id === player.id);

            return (
              <div
                key={player.id}
                className={`rounded-xl border-2 p-3 transition-all ${
                  sel
                    ? teamEntry?.team === 1
                      ? "border-red-400 bg-red-50 dark:bg-red-500/10"
                      : "border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-bold text-sm truncate">{player.name}</p>
                    <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${eloBadgeColor(player.elo)}`}>
                      {player.elo}
                    </span>
                  </div>

                  {sel ? (
                    <button
                      onClick={() => removePlayer(player.id)}
                      disabled={submitting}
                      className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => addToTeam(player, 1)}
                        disabled={submitting || team1.length >= 2}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
                      >
                        Red
                      </button>
                      <button
                        onClick={() => addToTeam(player, 2)}
                        disabled={submitting || team2.length >= 2}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
                      >
                        Blue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
