import { createContext } from 'react';
import type {PlayerTeam } from 'apis/foosball/types';

interface PlayerContextType {
  players: PlayerTeam[];
  addPlayer: (player: PlayerTeam) => void;
  removePlayer: (playerId: number) => void;
}

const PlayerContext = createContext<PlayerContextType>({
  players: [],
  addPlayer: () => {},
  removePlayer: () => {},
});

export default PlayerContext;