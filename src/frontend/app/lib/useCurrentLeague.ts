import { useSelector } from "react-redux";
import type { RootState } from "~/store";

/** The currently-selected league id, or null when none is chosen yet. */
export function useCurrentLeague(): number | null {
    return useSelector((s: RootState) => s.league.currentLeagueId);
}
