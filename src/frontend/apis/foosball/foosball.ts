import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { LeaderboardEntry, Player, PlayerMatchRecord, Season, SubmitMatch } from "./types";
import { getMockResponse } from '../../mocks/data'

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

const baseQueryWithMock: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    if (typeof window !== 'undefined' && window.location.search.includes('mock')) {
        const url = typeof args === 'string' ? args : args.url
        const fullUrl = API_BASE_URL + url
        const mockData = getMockResponse(fullUrl)
        if (mockData !== undefined) {
            return { data: mockData }
        }
    }
    return realBaseQuery(args, api, extraOptions)
}

export const foosballApi = createApi({
    reducerPath: 'foosballApi',
    baseQuery: baseQueryWithMock,
    tagTypes: ["match", "season"],
    endpoints: (builder) => ({
        getPlayers: builder.query<Player[], void>({
            query: () => 'player',
            providesTags: ["match"]
        }),
        postMatch: builder.mutation<void, SubmitMatch>({
            query: (match) => ({
                url: 'match',
                method: 'POST',
                body: match
            }),
            invalidatesTags: ["match", "season"]
        }),
        getSeasons: builder.query<Season[], void>({
            query: () => 'season',
            providesTags: ["season"]
        }),
        getActiveSeason: builder.query<Season, void>({
            query: () => 'season/active',
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
        getPlayerMatches: builder.query<PlayerMatchRecord[], void>({
            query: () => 'player/playerMatches',
            providesTags: ["match"]
        }),
        endSeason: builder.mutation<Season, number>({
            query: (id) => ({ url: `season/${id}/end`, method: 'POST' }),
            invalidatesTags: ["season", "match"]
        }),
        createSeason: builder.mutation<Season, { name: string }>({
            query: (body) => ({ url: 'season', method: 'POST', body }),
            invalidatesTags: ["season", "match"]
        }),
    }),
})

export const {
    useGetPlayersQuery,
    usePostMatchMutation,
    useGetSeasonsQuery,
    useGetActiveSeasonQuery,
    useGetSeasonQuery,
    useGetSeasonLeaderboardQuery,
    useGetPlayerMatchesQuery,
    useEndSeasonMutation,
    useCreateSeasonMutation,
} = foosballApi
