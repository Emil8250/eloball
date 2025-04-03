import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {Button} from "~/components/ui/button";
import type {Player, PlayerTeam} from "../../../apis/foosball/types";
import usePlayerContext from "~/context/PlayerContext/usePlayerContext";

interface PlayerCardProps {
    player: Player;
    minElo?: number;
    maxElo?: number;
}

export function PlayerCard(props: PlayerCardProps) {
    const { players, addPlayer, removePlayer } = usePlayerContext();
    
    // Count players in each team
    const teamRedCount = players.filter(p => p.team === 1).length;
    const teamBlueCount = players.filter(p => p.team === 2).length;
    
    // Check if teams are full
    const isTeamRedFull = teamRedCount >= 2;
    const isTeamBlueFull = teamBlueCount >= 2;
    
    const handleAddPlayer = (player: Player, team: number) => {
        // Check if player is already added to any team
        const isAlreadyAdded = players.some(p => p.player.id === player.id);
        if (isAlreadyAdded) return;
        
        // Check if the selected team is full
        if (team === 1 && isTeamRedFull) return;
        if (team === 2 && isTeamBlueFull) return;
        
        const teamPlayer = {player, team};
        addPlayer(teamPlayer);
    };
    
    // Check if this player is already added to a team
    const playerAlreadyAdded = players.some(p => p.player.id === props.player.id);
    
    // If player is already added, find which team they're on
    const playerTeam = players.find(p => p.player.id === props.player.id)?.team;
    const playerTeamName = playerTeam === 1 ? "Red" : "Blue";
    
    // Use provided min/max values or default to sensible ranges around the player's ELO
    const minElo = props.minElo || Math.max(0, props.player.elo - 150);
    const maxElo = props.maxElo || props.player.elo + 150;
    
    // Calculate progress percentage
    const progressPercentage = Math.min(100, Math.max(0, ((props.player.elo - minElo) / (maxElo - minElo)) * 100));
    
    // Get styling based on rank
    const getStyles = () => {
        if (!props.player.rank) {
            return {
                border: "border-2",
                bgColor: "bg-blue-100 dark:bg-blue-900/30",
                textColor: "text-blue-600 dark:text-blue-300",
                barColor: "bg-blue-500",
                shadow: ""
            };
        }
        
        switch (props.player.rank) {
            case 1: 
                return {
                    border: "border-4 border-yellow-500 dark:border-yellow-400",
                    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
                    textColor: "text-yellow-800 dark:text-yellow-300",
                    barColor: "bg-yellow-500 dark:bg-yellow-400",
                    shadow: "shadow-lg shadow-yellow-200 dark:shadow-yellow-900/30"
                };
            case 2: 
                return {
                    border: "border-4 border-slate-400 dark:border-slate-300",
                    bgColor: "bg-slate-200 dark:bg-slate-700/50",
                    textColor: "text-slate-800 dark:text-slate-300",
                    barColor: "bg-slate-500 dark:bg-slate-400",
                    shadow: "shadow-lg shadow-slate-200 dark:shadow-slate-900/30"
                };
            case 3: 
                return {
                    border: "border-4 border-amber-800 dark:border-amber-700",
                    bgColor: "bg-amber-100 dark:bg-amber-900/30",
                    textColor: "text-amber-900 dark:text-amber-300",
                    barColor: "bg-amber-800 dark:bg-amber-700",
                    shadow: "shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
                };
            default: 
                return {
                    border: "border-4 border-blue-200 dark:border-gray-700",
                    bgColor: "bg-blue-100 dark:bg-blue-900/30",
                    textColor: "text-blue-600 dark:text-blue-300",
                    barColor: "bg-blue-500 dark:bg-blue-600",
                    shadow: "shadow-lg"
                };
        }
    };
    
    // Medal emoji based on rank
    const getMedal = () => {
        if (!props.player.rank) return null;
        switch (props.player.rank) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return null;
        }
    };
    
    // Get rank display text
    const rankDisplay = props.player.rank ? `#${props.player.rank}` : '';
    // Get medal emoji
    const medalEmoji = getMedal();
    // Get styles based on rank
    const styles = getStyles();
    
    return (
        <Card className={`w-full relative flex flex-col p-0 gap-0 overflow-hidden ${styles.border} ${styles.shadow} ${playerAlreadyAdded ? 'opacity-75' : ''} dark:text-gray-200`}>
            <CardHeader className="p-0 m-0">
                <div className="flex justify-between items-center p-4 pb-3">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold dark:text-white">{props.player.name}</CardTitle>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400 dark:text-gray-300">{rankDisplay}</span>
                            {medalEmoji && <span className="text-lg">{medalEmoji}</span>}
                        </div>
                    </div>
                    {/* ELO score color matches border */}
                    <div className={`rounded-full ${styles.bgColor} px-4 py-2`}>
                        <span className={`${styles.textColor} font-bold text-xl`}>{props.player.elo}</span>
                    </div>
                </div>
            </CardHeader>
            
            {/* Progress bar color matches border */}
            <div className="px-4 py-0 m-0">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                        className={`${styles.barColor} h-2.5 rounded-full`} 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1 mb-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{minElo}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{maxElo}</span>
                </div>
            </div>
            
            {/* Team buttons with red for Team Red and blue for Team Blue */}
            <CardFooter className="flex items-center px-4 pb-4 pt-0">
                {playerAlreadyAdded ? (
                    <div className="w-full text-center">
                        <span className="text-gray-500 dark:text-gray-300">Already added to Team {playerTeamName}</span>
                        <Button 
                            className="ml-2 bg-gray-500 hover:bg-gray-600 text-white text-sm py-1 px-2 rounded"
                            onClick={() => removePlayer(props.player.id)}
                        >
                            Remove
                        </Button>
                    </div>
                ) : (
                    <>
                        <span className="text-gray-500 dark:text-gray-300 text-sm mr-3">Add to:</span>
                        <div className="flex gap-3 flex-1">
                            <Button 
                                className={`flex-1 ${isTeamRedFull ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white font-medium rounded-full transition-colors duration-200 transform hover:scale-105`}
                                onClick={() => {handleAddPlayer(props.player, 1)}}
                                disabled={isTeamRedFull}
                                title={isTeamRedFull ? "Team Red is full" : ""}
                            >
                                {isTeamRedFull ? "Team Red Full" : "Team Red"}
                            </Button>
                            <Button 
                                className={`flex-1 ${isTeamBlueFull ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium rounded-full transition-colors duration-200 transform hover:scale-105`}
                                onClick={() => {handleAddPlayer(props.player, 2)}}
                                disabled={isTeamBlueFull}
                                title={isTeamBlueFull ? "Team Blue is full" : ""}
                            >
                                {isTeamBlueFull ? "Team Blue Full" : "Team Blue"}
                            </Button>
                        </div>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
