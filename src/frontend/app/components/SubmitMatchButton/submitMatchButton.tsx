import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import { usePostMatchMutation } from "apis/foosball/foosball";
import { useEffect, useState } from "react";
import type { Match } from "apis/foosball/types";
import usePlayerContext from "~/context/PlayerContext/usePlayerContext";
import { toast } from "sonner";

export function SubmitMatchButton() {
    const { players, addPlayer, removePlayer } = usePlayerContext();
    const [postMatch, {isLoading, isSuccess}] = usePostMatchMutation()
    useEffect(() => {
        console.log(players)
    }, [players])

    const handleSubmit = (teamWonId: number) => {
        // Filter out any entries with playerId = 0 (our placeholder value)
        let validMatches: Match[] = [];
        players.map(player => {
            validMatches.push({playerId: player.player.id, teamId: player.team})
        })
        if (validMatches.length >= 2 && teamWonId) {
            postMatch({
                matches: validMatches,
                teamWonId
            })
        }
    }
    useEffect(() => {
        if (isSuccess) {
            toast("Match was posted!")
        }
    }, [isSuccess]);
        
    return (
        <Card className="w-[350px] m-4">
            <CardHeader>
                <CardTitle>Add Match</CardTitle>
                <CardDescription>Add up to 4 players (2 per team) and select winning team</CardDescription>
            </CardHeader>
            <CardContent>
                    {players.slice().sort((a, b) => a.team - b.team).map((player) => (
                        <>
                            <span>{player.player.name} - Team: {player.team}</span>
                            <button className="ml-4" onClick={() => removePlayer(player.player.id)}>[Remove]</button>
                            <br />
                        </>
                    ))}
            </CardContent>
            <CardFooter className="flex justify-between">
                <button onClick={() => handleSubmit(1)}>Team 1 Won!</button>
                <button onClick={() => handleSubmit(2)}>Team 2 Won!</button>
            </CardFooter>
        </Card>
    );
}