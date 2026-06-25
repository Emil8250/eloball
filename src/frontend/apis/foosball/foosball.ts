import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { LeaderboardEntry, LeagueMember, LeagueSummary, MyLeague, Player, PlayerMatchRecord, Season, SubmitMatch } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.billigeterninger.dk/api/'

let getToken: (() => Promise<string>) | null = null

export const setTokenGetter = (fn: (() => Promise<string>) | null) => {
    getToken = fn
}

const realBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
        if (getToken) {
            try {
                const token = await getToken()
                if (token)
                    headers.set('Authorization', `Bearer ${token}`)
            } catch (err) {
                console.error('[prepareHeaders] token fetch failed', err)
            }
        }
        return headers
    },
})

export const foosballApi = createApi({
    reducerPath: 'foosballApi',
    baseQuery: realBaseQuery,
    tagTypes: ["match", "season", "me", "league"],
    endpoints: (builder) => ({
        // League roster (members of the given league).
        getPlayers: builder.query<Player[], number>({
            query: (leagueId) => `player?leagueId=${leagueId}`,
            providesTags: ["match", "league"]
        }),
        // The player linked to the current account; 404 → needs onboarding.
        getMe: builder.query<Player, void>({
            query: () => 'player/me',
            providesTags: ["me"]
        }),
        getUnclaimedPlayers: builder.query<Player[], void>({
            query: () => 'player/unclaimed',
            providesTags: ["me"]
        }),
        claimPlayer: builder.mutation<Player, { playerId: number; email?: string }>({
            query: (body) => ({ url: 'player/claim', method: 'POST', body }),
            invalidatesTags: ["me", "match"]
        }),
        createPlayer: builder.mutation<Player, { name: string; email?: string }>({
            query: (body) => ({ url: 'player', method: 'POST', body }),
            invalidatesTags: ["me", "match"]
        }),
        renamePlayer: builder.mutation<Player, { name: string }>({
            query: (body) => ({ url: 'player/me', method: 'PUT', body }),
            invalidatesTags: ["me", "match"]
        }),
        postMatch: builder.mutation<void, SubmitMatch>({
            query: (match) => ({
                url: 'match',
                method: 'POST',
                body: match
            }),
            invalidatesTags: ["match", "season"]
        }),
        getSeasons: builder.query<Season[], number>({
            query: (leagueId) => `season?leagueId=${leagueId}`,
            providesTags: ["season"]
        }),
        getActiveSeason: builder.query<Season, number>({
            query: (leagueId) => `season/active?leagueId=${leagueId}`,
            providesTags: ["season"]
        }),
        getSeason: builder.query<Season, number>({
            query: (id) => `season/${id}`,
            providesTags: ["season"]
        }),
        getSeasonLeaderboard: builder.query<LeaderboardEntry[], number>({
            query: (id) => `season/${id}/leaderboard`,
            providesTags: ["season"]
        }),
        getPlayerMatches: builder.query<PlayerMatchRecord[], number>({
            query: (leagueId) => `player/playerMatches?leagueId=${leagueId}`,
            providesTags: ["match"]
        }),
        endSeason: builder.mutation<Season, number>({
            query: (id) => ({ url: `season/${id}/end`, method: 'POST' }),
            invalidatesTags: ["season", "match"]
        }),
        createSeason: builder.mutation<Season, { name: string; leagueId: number }>({
            query: (body) => ({ url: 'season', method: 'POST', body }),
            invalidatesTags: ["season", "match"]
        }),

        // --- Leagues ---
        getLeagues: builder.query<LeagueSummary[], void>({
            query: () => 'league',
            providesTags: ["league"]
        }),
        getMyLeagues: builder.query<MyLeague[], void>({
            query: () => 'league/mine',
            providesTags: ["league"]
        }),
        getLeagueMembers: builder.query<LeagueMember[], number>({
            query: (id) => `league/${id}/members`,
            providesTags: ["league"]
        }),
        createLeague: builder.mutation<{ id: number; name: string }, { name: string }>({
            query: (body) => ({ url: 'league', method: 'POST', body }),
            invalidatesTags: ["league"]
        }),
        renameLeague: builder.mutation<{ id: number; name: string }, { id: number; name: string }>({
            query: ({ id, name }) => ({ url: `league/${id}`, method: 'PUT', body: { name } }),
            invalidatesTags: ["league"]
        }),
        joinLeague: builder.mutation<void, number>({
            query: (id) => ({ url: `league/${id}/join`, method: 'POST' }),
            invalidatesTags: ["league"]
        }),
        leaveLeague: builder.mutation<void, number>({
            query: (id) => ({ url: `league/${id}/leave`, method: 'POST' }),
            invalidatesTags: ["league"]
        }),
        claimOwnership: builder.mutation<void, number>({
            query: (id) => ({ url: `league/${id}/claim-ownership`, method: 'POST' }),
            invalidatesTags: ["league"]
        }),
        delegateOwnership: builder.mutation<void, { id: number; playerId: number }>({
            query: ({ id, playerId }) => ({ url: `league/${id}/delegate`, method: 'POST', body: { playerId } }),
            invalidatesTags: ["league"]
        }),
        removeMember: builder.mutation<void, { id: number; playerId: number }>({
            query: ({ id, playerId }) => ({ url: `league/${id}/members/${playerId}/remove`, method: 'POST' }),
            invalidatesTags: ["league"]
        }),
        deleteLeague: builder.mutation<void, number>({
            query: (id) => ({ url: `league/${id}`, method: 'DELETE' }),
            invalidatesTags: ["league", "season", "match"]
        }),
    }),
})

export const {
    useGetPlayersQuery,
    useGetMeQuery,
    useGetUnclaimedPlayersQuery,
    useClaimPlayerMutation,
    useCreatePlayerMutation,
    useRenamePlayerMutation,
    usePostMatchMutation,
    useGetSeasonsQuery,
    useGetActiveSeasonQuery,
    useGetSeasonQuery,
    useGetSeasonLeaderboardQuery,
    useGetPlayerMatchesQuery,
    useEndSeasonMutation,
    useCreateSeasonMutation,
    useGetLeaguesQuery,
    useGetMyLeaguesQuery,
    useGetLeagueMembersQuery,
    useCreateLeagueMutation,
    useRenameLeagueMutation,
    useJoinLeagueMutation,
    useLeaveLeagueMutation,
    useClaimOwnershipMutation,
    useDelegateOwnershipMutation,
    useRemoveMemberMutation,
    useDeleteLeagueMutation,
} = foosballApi
