import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { LeaderboardEntry, Player, Season, SubmitMatch } from "./types";
import { getMockResponse } from '../../mocks/data'

const realBaseQuery = fetchBaseQuery({ baseUrl: 'https://api.billigeterninger.dk/api/' })

const baseQueryWithMock: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
    if (typeof window !== 'undefined' && window.location.search.includes('mock')) {
        const url = typeof args === 'string' ? args : args.url
        const fullUrl = 'https://api.billigeterninger.dk/api/' + url
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
    useEndSeasonMutation,
    useCreateSeasonMutation,
} = foosballApi
