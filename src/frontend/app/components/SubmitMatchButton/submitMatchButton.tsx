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

export function SubmitMatchButton() {
    const [postMatch, {isLoading: isPosting}] = usePostMatchMutation()
    const [firstPlayerId, setFirstPlayerId] = useState<number>()
    const [secondPlayerId, setSecondPlayerId] = useState<number>()
    const [playerWonId, setPlayerWonId] = useState<number>()

    const handleSubmit = () => {
        if (firstPlayerId && secondPlayerId && playerWonId) {
            postMatch({
                firstPlayerId,
                secondPlayerId,
                playerWonId
            })
        }
    }

    return (
        <Card className="w-[350px] m-4">
            <CardHeader>
                <CardTitle>Add Match</CardTitle>
                <CardDescription>Add the 2 players who participated and who won</CardDescription>
            </CardHeader>
            <CardContent>
                <Input 
                    type="number" 
                    placeholder="First Player ID" 
                    onChange={(e) => setFirstPlayerId(Number(e.target.value))}
                />
                <Input 
                    type="number" 
                    placeholder="Second Player ID" 
                    onChange={(e) => setSecondPlayerId(Number(e.target.value))}
                />
                <Input 
                    type="number" 
                    placeholder="Player Won ID" 
                    onChange={(e) => setPlayerWonId(Number(e.target.value))}
                />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type={"button"} onClick={handleSubmit}>Submit Match</Button>
            </CardFooter>
        </Card>
    );
}