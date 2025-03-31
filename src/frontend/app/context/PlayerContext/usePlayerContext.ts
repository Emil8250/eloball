import { useContext } from "react";
import PlayerContext from "./PlayerContext";

const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (!context) {
      throw new Error('useIntegerContext must be used within an IntegerProvider');
    }
    return context;
  };

  export default usePlayerContext;