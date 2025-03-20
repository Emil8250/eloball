import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {Button} from "~/components/ui/button";
import type {Player} from "../../../apis/foosball/types";

interface PlayerCardProps {
    player: Player
}
export function PlayerCard(props: PlayerCardProps) {
    return (
        <Card className="w-[350px] m-4">
            <CardHeader>
                <CardTitle>{props.player.name}</CardTitle>
                <CardDescription>
                    ID: {props.player.id}
                    <br />
                    ELO: {props.player.elo}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
                <Button onClick={() => {console.log(props.player.id)}}>Select</Button>
            </CardFooter>
        </Card>
    );
}