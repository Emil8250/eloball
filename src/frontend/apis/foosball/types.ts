export interface WeatherForecast {
    date: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}

export interface Player {
    id: number;
    name: string;
    elo: number;
}

export interface Match {
    firstPlayerId: number;
    secondPlayerId: number;
    playerWonId: number;
}
