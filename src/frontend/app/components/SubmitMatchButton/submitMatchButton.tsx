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
import { useState } from "react";
import type { Match } from "apis/foosball/types";

export function SubmitMatchButton() {
    const [postMatch, {isLoading: isPosting}] = usePostMatchMutation()
    const [matches, setMatches] = useState<Match[]>([
        { playerId: 0, teamId: 1 },
        { playerId: 0, teamId: 1 },
        { playerId: 0, teamId: 2 },
        { playerId: 0, teamId: 2 }
    ]);
    const [teamWonId, setTeamWonId] = useState<number>();

    const handleSubmit = () => {
        // Filter out any entries with playerId = 0 (our placeholder value)
        const validMatches = matches.filter(m => m.playerId !== 0);
        if (validMatches.length >= 2 && teamWonId) {
            postMatch({
                matches: validMatches,
                teamWonId
            })
        }
    }

    const updatePlayerId = (index: number, playerId: number) => {
        setMatches(currentMatches => {
            const newMatches = [...currentMatches];
            newMatches[index] = { 
                playerId: playerId,
                teamId: index < 2 ? 1 : 2  // First two players are team 1, others team 2
            };
            return newMatches;
        });
    };
    return (
        <Card className="w-[350px] m-4">
            <CardHeader>
                <CardTitle>Add Match</CardTitle>
                <CardDescription>Add up to 4 players (2 per team) and select winning team</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Team 1</h3>
                    <Input
                        className="mb-1"
                        type="number"
                        placeholder="Player 1 ID"
                        onChange={(e) => updatePlayerId(0, Number(e.target.value))}
                    />
                    <Input
                        className="mb-1"
                        type="number"
                        placeholder="Player 2 ID (optional)"
                        onChange={(e) => updatePlayerId(1, Number(e.target.value))}
                    />
                </div>
                <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Team 2</h3>
                    <Input
                        className="mb-1"
                        type="number"
                        placeholder="Player 3 ID"
                        onChange={(e) => updatePlayerId(2, Number(e.target.value))}
                    />
                    <Input
                        className="mb-1"
                        type="number"
                        placeholder="Player 4 ID (optional)"
                        onChange={(e) => updatePlayerId(3, Number(e.target.value))}
                    />
                </div>
                <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Winning Team</h3>
                    <Input
                        className="mb-1"
                        type="number"
                        placeholder="Team Won ID (1 or 2)"
                        onChange={(e) => setTeamWonId(Number(e.target.value))}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="button" onClick={handleSubmit}>Submit Match</Button>
            </CardFooter>
        </Card>
    );
}