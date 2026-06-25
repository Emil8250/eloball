export interface Player {
    id: number;
    name: string;
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
    leagueId: number;
    egg?: boolean;
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
    latestElo: number | null;
    matchesPlayed: number;
    matchesWon: number;
    winRate: number;
}

export type LeagueRole = "Owner" | "Member";

export interface LeagueSummary {
    id: number;
    name: string;
    memberCount: number;
    isMember: boolean;
    hasOwner: boolean;
}

export interface MyLeague {
    id: number;
    name: string;
    role: LeagueRole;
    memberCount: number;
    hasOwner: boolean;
}

export interface LeagueMember {
    playerId: number;
    name: string;
    role: LeagueRole;
}
