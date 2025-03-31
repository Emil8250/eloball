import React, { useState, type ReactNode } from 'react';
import PlayerContext from './PlayerContext';
import type { Player, PlayerProviderProps, PlayerTeam } from 'apis/foosball/types';

const PlayerProvider = ({ children }: PlayerProviderProps) => {
  const [players, setPlayers] = useState<PlayerTeam[]>([]);

  const addPlayer = (player: PlayerTeam) => {
    setPlayers(currentPlayers => [...currentPlayers, player]);
  };

  const removePlayer = (playerId: number) => {
    setPlayers(currentPlayers => 
      currentPlayers.filter(player => player.player.id !== playerId)
    );
  };

  return (
    <PlayerContext.Provider 
      value={{
        players,
        addPlayer,
        removePlayer
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;