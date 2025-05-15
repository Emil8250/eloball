import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {Button} from "~/components/ui/button";
import { usePostMatchMutation } from "apis/foosball/foosball";
import {useCallback, useEffect} from "react";
import type { Match, PlayerTeam } from "apis/foosball/types";
import usePlayerContext from "~/context/PlayerContext/usePlayerContext";
import { toast } from "sonner";

export function SubmitMatchButton() {
    const { players, addPlayer, removePlayer } = usePlayerContext();
    const [postMatch, {isLoading, isSuccess}] = usePostMatchMutation();

    useEffect(() => {
        console.log(players);
    }, [players]);

    const handleSubmit = (teamWonId: number) => {
        let validMatches: Match[] = [];
        players.map(player => {
            validMatches.push({playerId: player.player.id, teamId: player.team});
        });

        const team1Exists = validMatches.some(m => m.teamId === 1);
        const team2Exists = validMatches.some(m => m.teamId === 2);

        if (validMatches.length >= 2 && teamWonId && team1Exists && team2Exists) {
            postMatch({
                matches: validMatches,
                teamWonId
            });
        } else if (validMatches.length >= 2 && teamWonId) {
             toast.error("Cannot submit match: Both teams need at least one player.");
        }
    };

    const CallibrateTeams = useCallback(() => {
        if (players.length < 3 || players.length > 4) {
             toast.warning("Calibration requires 3 or 4 players.");
             return;
        }

        const sortedPlayers = [...players].sort((a, b) => a.player.elo - b.player.elo);
        let updatedPlayers: PlayerTeam[] = [];

        if (players.length === 4) {
            const lowest = sortedPlayers[0];
            const middle1 = sortedPlayers[1];
            const middle2 = sortedPlayers[2];
            const highest = sortedPlayers[3];
            updatedPlayers = [
                { ...highest, team: 1 }, { ...lowest, team: 1 },
                { ...middle1, team: 2 }, { ...middle2, team: 2 },
            ];
        } else if (players.length === 3) {
            const lowest = sortedPlayers[0];
            const middle = sortedPlayers[1];
            const highest = sortedPlayers[2];
            updatedPlayers = [
                { ...highest, team: 1 },
                { ...lowest, team: 2 }, { ...middle, team: 2 },
            ];
        }

        players.forEach(p => removePlayer(p.player.id));
        updatedPlayers.forEach(p => addPlayer(p));
        toast.success(`Teams calibrated for ${players.length} players.`);

    }, [players, removePlayer, addPlayer]);

    const swapTeams = useCallback(() => {
        if (players.length < 2) return;

        const updatedPlayers = players.map(p => ({
            ...p,
            team: p.team === 1 ? 2 : 1
        }));

        players.forEach(p => removePlayer(p.player.id));
        updatedPlayers.forEach(p => addPlayer(p));

    }, [players, removePlayer, addPlayer]);


    useEffect(() => {
        if (isSuccess) {
            toast("Match was posted!");
        }
    }, [isSuccess]);

    const team1Players = players.filter(player => player.team === 1);
    const team2Players = players.filter(player => player.team === 2);

    const canSubmit = team1Players.length > 0 && team2Players.length > 0 && players.length >=2 ;
    const canCalibrate = players.length >= 3 && players.length <= 4;
    const canSwap = players.length >= 2;

    return (
        <Card className="w-[350px] border-4 mx-auto lg:mx-0 dark:border-gray-700 dark:text-gray-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-2xl dark:text-white">Add Match</CardTitle>
                <CardDescription className="dark:text-gray-300">Add 2-4 players and select winning team</CardDescription>
            </CardHeader>

            <CardContent className="pb-0">
                 <div className="flex gap-4">
                    {/* Team Red Section */}
                     <div className="flex-1 border-2 border-red-500 dark:border-red-700 rounded-lg p-3">
                        <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Team Red</h3>
                        <div className="space-y-3">
                            {/* Slot 1 (Always visible) */}
                             <div className={`border-2 ${team1Players[0] ? 'border-solid border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/30' : 'border-dashed dark:border-gray-600'} rounded-lg p-3 min-h-[80px] flex items-center justify-center`}>
                                {team1Players[0] ? (
                                    <div className="w-full text-center sm:text-left">
                                        <p className="font-medium dark:text-white">{team1Players[0].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team1Players[0].player.elo}</p>
                                        <button className="text-red-500 dark:text-red-400 text-xs hover:underline mt-1" onClick={() => removePlayer(team1Players[0].player.id)}>Remove</button>
                                    </div>
                                ) : ( <span className="text-gray-400 dark:text-gray-400 text-sm">Player 1</span> )}
                            </div>
                            {/* Slot 2 (Always visible) */}
                            {/* *** REMOVED CONDITIONAL WRAPPER *** */}
                            <div className={`border-2 ${team1Players[1] ? 'border-solid border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/30' : 'border-dashed dark:border-gray-600'} rounded-lg p-3 min-h-[80px] flex items-center justify-center`}>
                                {team1Players[1] ? (
                                    <div className="w-full text-center sm:text-left">
                                        <p className="font-medium dark:text-white">{team1Players[1].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team1Players[1].player.elo}</p>
                                        <button className="text-red-500 dark:text-red-400 text-xs hover:underline mt-1" onClick={() => removePlayer(team1Players[1].player.id)}>Remove</button>
                                    </div>
                                ) : ( <span className="text-gray-400 dark:text-gray-400 text-sm">Player 2</span> )} {/* Removed conditional styling */}
                            </div>
                        </div>
                    </div>

                    {/* Team Blue Section */}
                     <div className="flex-1 border-2 border-blue-500 dark:border-blue-700 rounded-lg p-3">
                        <h3 className="font-bold text-lg mb-2 dark:text-gray-100\">Team Blue</h3>
                        <div className="space-y-3">
                            {/* Slot 1 (Always visible) */}
                            <div className={`border-2 ${team2Players[0] ? 'border-solid border-blue-500 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/30' : 'border-dashed dark:border-gray-600'} rounded-lg p-3 min-h-[80px] flex items-center justify-center`}>
                                {team2Players[0] ? (
                                    <div className="w-full text-center sm:text-left">
                                        <p className="font-medium dark:text-white">{team2Players[0].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team2Players[0].player.elo}</p>
                                        <button className="text-blue-500 dark:text-blue-400 text-xs hover:underline mt-1" onClick={() => removePlayer(team2Players[0].player.id)}>Remove</button>
                                    </div>
                                ) : ( <span className="text-gray-400 dark:text-gray-400 text-sm">Player 1</span> )}
                            </div>
                             {/* Slot 2 (Always visible) */}
                             {/* *** REMOVED CONDITIONAL WRAPPER *** */}
                            <div className={`border-2 ${team2Players[1] ? 'border-solid border-blue-500 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/30' : 'border-dashed dark:border-gray-600'} rounded-lg p-3 min-h-[80px] flex items-center justify-center`}>
                                {team2Players[1] ? (
                                    <div className="w-full text-center sm:text-left">
                                        <p className="font-medium dark:text-white">{team2Players[1].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team2Players[1].player.elo}</p>
                                        <button className="text-blue-500 dark:text-blue-400 text-xs hover:underline mt-1" onClick={() => removePlayer(team2Players[1].player.id)}>Remove</button>
                                    </div>
                                ) : ( <span className="text-gray-400 dark:text-gray-400 text-sm">Player 2</span> )} {/* Removed conditional styling */}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex justify-center items-center gap-2 mt-4 w-full">
                    <Button
                        className="bg-fuchsia-500 hover:bg-fuchsia-600 dark:bg-fuchsia-700 dark:hover:bg-fuchsia-800 text-white font-medium rounded-full px-6 py-3 flex-grow flex items-center justify-center disabled:opacity-50"
                        onClick={CallibrateTeams}
                        disabled={!canCalibrate || isLoading}
                        title={canCalibrate ? "Calibrate teams based on ELO rating" : "Requires 3 or 4 players to calibrate"}
                    >
                        Calibrate Teams <span className="ml-2 text-xl hidden sm:inline">⚖</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full border-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={swapTeams}
                        disabled={!canSwap || isLoading}
                        title={canSwap ? "Swap players between teams" : "Requires at least 2 players to swap"}
                    >
                        <span className="text-xl">⇄</span>
                    </Button>
                </div>
            </CardContent>

            <CardFooter className="px-6 pt-2 pb-6 flex justify-center gap-4">
                <Button
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium rounded-full px-6 py-3 flex-1 max-w-[140px] disabled:opacity-50"
                    onClick={() => handleSubmit(1)}
                    disabled={!canSubmit || isLoading}
                    title={canSubmit ? "Submit match with Red team winning" : "Requires players on both teams to submit"}
                >
                    Red Won
                </Button>
                <Button
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-full px-6 py-3 flex-1 max-w-[140px] disabled:opacity-50"
                    onClick={() => handleSubmit(2)}
                    disabled={!canSubmit || isLoading}
                    title={canSubmit ? "Submit match with Blue team winning" : "Requires players on both teams to submit"}
                >
                    Blue Won
                </Button>
            </CardFooter>
        </Card>
    );
}
