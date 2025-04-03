import { useGetPlayersQuery } from "../../../apis/foosball/foosball";
import { PlayerCard } from "~/components/PlayerCard/playerCard";
import { SubmitMatchButton } from "../SubmitMatchButton/submitMatchButton";
import PlayerProvider from "~/context/PlayerContext/PlayerProvider";
import { useEffect, useState } from "react";

export function Welcome() {
    const { data, error, isLoading } = useGetPlayersQuery();
    const [minElo, setMinElo] = useState(0);
    const [maxElo, setMaxElo] = useState(1200);

    // Calculate min and max ELO values once data is loaded
    useEffect(() => {
        if (data && data.length > 0) {
            // Find the minimum and maximum ELO scores
            const minValue = Math.min(...data.map(player => player.elo));
            const maxValue = Math.max(...data.map(player => player.elo));
            
            // Add some padding to the min/max values for better visualization
            setMinElo(Math.max(0, minValue - 50));
            setMaxElo(maxValue + 50);
        }
    }, [data]);

    if (error) {
        console.error('API Error:', error);
        return <div className="p-8 text-red-500">Error loading player data</div>;
    }

    // Sort players by ELO score and add rank property
    const sortedPlayers = data
        ? [...data]
            .sort((a, b) => b.elo - a.elo)
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }))
        : [];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
            {/* Header with Logo */}
            <header className="bg-white dark:bg-[#252525] shadow-md py-2">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Use different logo based on dark/light mode */}
                        <img 
                            src="/logo.png" 
                            alt="Logo" 
                            className="h-20 w-auto block dark:hidden" 
                        />
                        <img 
                            src="/logo-dark.png" 
                            alt="Logo" 
                            className="h-20 w-auto hidden dark:block" 
                        />
                    </div>
                    
                    <div className="text-gray-500 dark:text-gray-300">
                        {!isLoading && data && (
                            <span>{data.length} Players</span>
                        )}
                    </div>
                </div>
            </header>


            {/* Main Content */}
            <PlayerProvider>
                <main className="flex-grow container mx-auto py-8 px-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center lg:items-start lg:flex-row gap-8">
                            {/* Left column for SubmitMatchButton */}
                            <div className="w-full max-w-[350px] lg:w-auto lg:sticky lg:top-8">
                                <SubmitMatchButton />
                            </div>
                            
                            {/* Right column for PlayerCards - fixed layout issues */}
                            <div className="w-full flex-1">
                                <div className="flex flex-wrap justify-center gap-6">
                                    {sortedPlayers.map((player) => (
                                        <div key={player.id} className="w-full max-w-[350px] sm:max-w-[350px] md:max-w-[350px] lg:max-w-[350px]">
                                            <PlayerCard 
                                                player={player}
                                                minElo={minElo}
                                                maxElo={maxElo}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </PlayerProvider>

            {/* Footer */}
            <footer className="bg-gray-800 dark:bg-gray-950 text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <p className="text-center md:text-left">&copy; 2025 TDC Erhverv Cloud & Cyber Hub</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-400 text-sm">Powered by</span>
                            <div className="ml-2 bg-gray-700 dark:bg-gray-800 rounded-md px-3 py-1 flex items-center">
                                <span className="font-mono font-bold text-blue-400">EI</span>
                                <span className="mx-1 text-gray-500">-</span>
                                <span className="font-medium text-gray-300">Emil Intelligence</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
