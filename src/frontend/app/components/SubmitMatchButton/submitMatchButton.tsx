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
import { useEffect, useState } from "react";
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
    
    useEffect(() => {
        if (isSuccess) {
            toast("Match was posted!");
        }
    }, [isSuccess]);
    
    // Group players by team
    const team1Players = players.filter(player => player.team === 1);
    const team2Players = players.filter(player => player.team === 2);
    
    return (
        <Card className="w-[350px] border-2 mx-auto lg:mx-0">
            <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Add Match</CardTitle>
                <CardDescription>Add up to 4 players (2 per team) and select winning team</CardDescription>
            </CardHeader>
            
            <CardContent className="pb-6">
                <div className="flex gap-4">
                    {/* Team Red Section */}
                    <div className="flex-1 border-2 border-red-500 rounded-lg p-3">
                        <h3 className="font-bold text-lg mb-2">Team Red</h3>
                        
                        {/* Team Red Player Slots */}
                        <div className="space-y-3">
                            <div className={`border-2 ${team1Players[0] ? 'border-solid border-red-500 bg-red-100' : 'border-dashed'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team1Players[0] ? (
                                    <div className="w-full">
                                        <p className="font-medium">{team1Players[0].player.name}</p>
                                        <p className="text-sm text-gray-500">ELO: {team1Players[0].player.elo}</p>
                                        <button 
                                            className="text-red-500 text-xs hover:underline" 
                                            onClick={() => removePlayer(team1Players[0].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">Add player from list</span>
                                )}
                            </div>
                            
                            <div className={`border-2 ${team1Players[1] ? 'border-solid border-red-500 bg-red-100' : 'border-dashed'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team1Players[1] ? (
                                    <div className="w-full">
                                        <p className="font-medium">{team1Players[1].player.name}</p>
                                        <p className="text-sm text-gray-500">ELO: {team1Players[1].player.elo}</p>
                                        <button 
                                            className="text-red-500 text-xs hover:underline" 
                                            onClick={() => removePlayer(team1Players[1].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">optional</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Team Blue Section */}
                    <div className="flex-1 border-2 border-blue-500 rounded-lg p-3">
                        <h3 className="font-bold text-lg mb-2">Team Blue</h3>
                        
                        {/* Team Blue Player Slots */}
                        <div className="space-y-3">
                            <div className={`border-2 ${team2Players[0] ? 'border-solid border-blue-500 bg-blue-100' : 'border-dashed'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team2Players[0] ? (
                                    <div className="w-full">
                                        <p className="font-medium">{team2Players[0].player.name}</p>
                                        <p className="text-sm text-gray-500">ELO: {team2Players[0].player.elo}</p>
                                        <button 
                                            className="text-blue-500 text-xs hover:underline" 
                                            onClick={() => removePlayer(team2Players[0].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">Add player from list</span>
                                )}
                            </div>
                            
                            <div className={`border-2 ${team2Players[1] ? 'border-solid border-blue-500 bg-blue-100' : 'border-dashed'} rounded-lg p-3 h-20 flex items-center justify-center`}>
                                {team2Players[1] ? (
                                    <div className="w-full">
                                        <p className="font-medium">{team2Players[1].player.name}</p>
                                        <p className="text-sm text-gray-500">ELO: {team2Players[1].player.elo}</p>
                                        <button 
                                            className="text-blue-500 text-xs hover:underline" 
                                            onClick={() => removePlayer(team2Players[1].player.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">optional</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            
            {/* Updated footer to keep buttons inside the card properly */}
            <CardFooter className="px-6 pb-6 flex justify-center flex-wrap gap-4">
                <Button 
                    className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-full px-6 py-3 min-w-[120px]"
                    onClick={() => handleSubmit(1)}
                    disabled={team1Players.length === 0 || team2Players.length === 0}
                >
                    Team Red Won
                </Button>
                <Button 
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full px-6 py-3 min-w-[120px]"
                    onClick={() => handleSubmit(2)}
                    disabled={team1Players.length === 0 || team2Players.length === 0}
                >
                    Team Blue Won
                </Button>
            </CardFooter>
        </Card>
    );
}
