import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const STORAGE_KEY = 'eloball_active_league_v1'

function loadInitial(): number | null {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const n = raw == null ? NaN : Number(raw)
    return Number.isFinite(n) ? n : null
}

const leagueSlice = createSlice({
    name: 'league',
    initialState: { currentLeagueId: loadInitial() as number | null },
    reducers: {
        setCurrentLeague(state, action: PayloadAction<number | null>) {
            state.currentLeagueId = action.payload
            if (typeof window !== 'undefined') {
                if (action.payload == null) window.localStorage.removeItem(STORAGE_KEY)
                else window.localStorage.setItem(STORAGE_KEY, String(action.payload))
            }
        },
    },
})

export const { setCurrentLeague } = leagueSlice.actions
export default leagueSlice.reducer
