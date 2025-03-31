import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {Button} from "~/components/ui/button";
import type {Player, PlayerTeam} from "../../../apis/foosball/types";
import usePlayerContext from "~/context/PlayerContext/usePlayerContext";
import { useEffect } from "react";

interface PlayerCardProps {
    player: Player
}
export function PlayerCard(props: PlayerCardProps) {
    const { players, addPlayer, removePlayer } = usePlayerContext();
    const handleAddPlayer = (player: Player, team: number) => {
        const teamPlayer = {player, team}
        addPlayer(teamPlayer);
      };
    return (
        <Card className="w-[350px] m-4 h-[150px]">
            <CardHeader>
                <CardTitle>{props.player.name}</CardTitle>
                <CardDescription>
                    ELO: {props.player.elo}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
                <Button onClick={() => {handleAddPlayer(props.player, 1)}}>Team 1</Button>
                <Button onClick={() => {handleAddPlayer(props.player, 2)}}>Team 2</Button>
            </CardFooter>
        </Card>
    );
}