export interface Player {
    id: number;
    name: string;
    elo: number;
    rank?: number;
}

export interface PlayerTeam {
    player: Player;
    team: number;
}

export interface PlayerProviderProps {
    children: React.ReactNode;
}

export interface Match {
    playerId: number;
    teamId: number;
}

export interface SubmitMatch {
    teamWonId: number;
    matches: Match[];
}

export interface MatchInfo {
    id: number;
    playerWonId: number;
    createdDateTime: string;
    egg: boolean;
    seasonId: number | null;
}

export interface PlayerMatchRecord {
    id: number;
    matchId: number;
    playerId: number;
    team: number;
    player: Player;
    match: MatchInfo;
}

export interface Season {
    id: number;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface LeaderboardEntry {
    playerId: number;
    playerName: string;
    startingElo: number;
    finalElo: number | null;
    matchesPlayed: number;
    matchesWon: number;
    winRate: number;
}
