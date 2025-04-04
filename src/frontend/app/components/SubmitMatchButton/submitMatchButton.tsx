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
import {useCallback, useEffect, useState} from "react";
import type { Match } from "apis/foosball/types";
import usePlayerContext from "~/context/PlayerContext/usePlayerContext";
import { toast } from "sonner";

export function SubmitMatchButton() {
    const { players, addPlayer, removePlayer } = usePlayerContext();
    const [postMatch, {isLoading, isSuccess}] = usePostMatchMutation();
    
    useEffect(() => {
        console.log(players);
    }, [players]);

    const handleSubmit = (teamWonId: number) => {
        // Filter out any entries with playerId = 0 (our placeholder value)
        let validMatches: Match[] = [];
        players.map(player => {
            validMatches.push({playerId: player.player.id, teamId: player.team});
        });
        if (validMatches.length >= 2 && teamWonId) {
            postMatch({
                matches: validMatches,
                teamWonId
            });
        }
    };
    
    const CallibrateTeams = useCallback(() => {
        const maxEloPlayer = players.reduce(function(prev, current) {
            return (prev && prev.player.elo > current.player.elo) ? prev : current
        });

        const minEloPlayer = players.reduce(function(prev, current) {
            return (prev && prev.player.elo < current.player.elo) ? prev : current
        });

        const remainingPlayers = players.filter(x => x.player.id !== maxEloPlayer.player.id && x.player.id !== minEloPlayer.player.id);
        
        removePlayer(maxEloPlayer.player.id);
        removePlayer(minEloPlayer.player.id);
        removePlayer(remainingPlayers[0].player.id);
        removePlayer(remainingPlayers[1].player.id);
        
        maxEloPlayer.team = 1;
        minEloPlayer.team = 1;
        
        remainingPlayers[0].team = 2;
        remainingPlayers[1].team = 2;

        addPlayer(maxEloPlayer);
        addPlayer(minEloPlayer);
        addPlayer(remainingPlayers[0]);
        addPlayer(remainingPlayers[1]);
    }, [players, removePlayer, addPlayer]);
    
    useEffect(() => {
        if (isSuccess) {
            toast("Match was posted!");
        }
    }, [isSuccess]);
    
    // Group players by team
    const team1Players = players.filter(player => player.team === 1);
    const team2Players = players.filter(player => player.team === 2);
    
    return (
        <Card className="w-[350px] border-4 mx-auto lg:mx-0 dark:border-gray-700 dark:text-gray-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-2xl dark:text-white">Add Match</CardTitle>
                <CardDescription className="dark:text-gray-300">Add up to 4 players (2 per team) and select winning team</CardDescription>
            </CardHeader>
            
            <CardContent className="pb-0">
                <div className="flex gap-4">
                    {/* Team Red Section */}
                    <div className="flex-1 border-2 border-red-500 dark:border-red-700 rounded-lg p-3">
                        <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Team Red</h3>
                        
                        {/* Team Red Player Slots */}
                        <div className="space-y-3">
                            <div className={`border-2 ${team1Players[0] 
                                ? 'border-solid border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/30' 
                                : 'border-dashed dark:border-gray-600'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team1Players[0] ? (
                                    <div className="w-full">
                                        <p className="font-medium dark:text-white">{team1Players[0].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team1Players[0].player.elo}</p>
                                        <button 
                                            className="text-red-500 dark:text-red-400 text-xs hover:underline" 
                                            onClick={() => removePlayer(team1Players[0].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-400">Goalkeeper</span>
                                )}
                            </div>
                            
                            <div className={`border-2 ${team1Players[1] 
                                ? 'border-solid border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/30' 
                                : 'border-dashed dark:border-gray-600'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team1Players[1] ? (
                                    <div className="w-full">
                                        <p className="font-medium dark:text-white">{team1Players[1].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team1Players[1].player.elo}</p>
                                        <button 
                                            className="text-red-500 dark:text-red-400 text-xs hover:underline" 
                                            onClick={() => removePlayer(team1Players[1].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-400">Forward</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Team Blue Section */}
                    <div className="flex-1 border-2 border-blue-500 dark:border-blue-700 rounded-lg p-3">
                        <h3 className="font-bold text-lg mb-2 dark:text-gray-100">Team Blue</h3>
                        
                        {/* Team Blue Player Slots */}
                        <div className="space-y-3">
                            <div className={`border-2 ${team2Players[0] 
                                ? 'border-solid border-blue-500 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/30' 
                                : 'border-dashed dark:border-gray-600'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team2Players[0] ? (
                                    <div className="w-full">
                                        <p className="font-medium dark:text-white">{team2Players[0].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team2Players[0].player.elo}</p>
                                        <button 
                                            className="text-blue-500 dark:text-blue-400 text-xs hover:underline" 
                                            onClick={() => removePlayer(team2Players[0].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-400">Goalkeeper</span>
                                )}
                            </div>
                            
                            <div className={`border-2 ${team2Players[1] 
                                ? 'border-solid border-blue-500 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/30' 
                                : 'border-dashed dark:border-gray-600'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team2Players[1] ? (
                                    <div className="w-full">
                                        <p className="font-medium dark:text-white">{team2Players[1].player.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">ELO: {team2Players[1].player.elo}</p>
                                        <button 
                                            className="text-blue-500 dark:text-blue-400 text-xs hover:underline" 
                                            onClick={() => removePlayer(team2Players[1].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-400">Forward</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center mt-4 w-full">
                    <Button
                        className="bg-fuchsia-500 hover:bg-fuchsia-600 dark:bg-fuchsia-700 dark:hover:bg-fuchsia-800 text-white font-medium rounded-full px-6 py-3 w-full flex items-center justify-center"
                        onClick={CallibrateTeams}
                        disabled={players.length !== 4}
                    >
                        Calibrate Teams by ELO <span className="ml-2 text-xl">⚖</span>
                    </Button>
                </div>
            </CardContent>

            {/* Updated footer with just the win buttons */}
            <CardFooter className="px-6 pt-2 pb-6 flex justify-center gap-4">
                <Button 
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium rounded-full px-6 py-3 flex-1 max-w-[140px]"
                    onClick={() => handleSubmit(1)}
                    disabled={team1Players.length === 0 || team2Players.length === 0}
                >
                    Red Won
                </Button>
                <Button 
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-full px-6 py-3 flex-1 max-w-[140px]"
                    onClick={() => handleSubmit(2)}
                    disabled={team1Players.length === 0 || team2Players.length === 0}
                >
                    Blue Won
                </Button>
            </CardFooter>
        </Card>
    );
}
