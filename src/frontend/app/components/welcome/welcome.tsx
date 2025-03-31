import {useGetPlayersQuery } from "../../../apis/foosball/foosball";
import {PlayerCard} from "~/components/PlayerCard/playerCard";
import { SubmitMatchButton } from "../SubmitMatchButton/submitMatchButton";

export function Welcome() {
    const {data, error, isLoading} = useGetPlayersQuery()
    if (error) {
        console.error('Weather API Error:', error);
    }
    if (isLoading)
        return "Loading...";
    if (data)
        console.log(data);
    return (
        <main className="flex flex-wrap gap-6 p-4 md:p-8 justify-around">
                        <div className="flex-row">
                <SubmitMatchButton/>
            </div>  
            <div className="flex-row">
                {data?.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                ))}
            </div> 
        </main>
    );
}
