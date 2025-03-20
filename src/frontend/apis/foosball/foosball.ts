// Need to use the React-specific entry point to import createApi
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import type {Match, Player, WeatherForecast} from "./types";

// Define a service using a base URL and expected endpoints
export const foosballApi = createApi({
        reducerPath: 'foosballApi',
        baseQuery: fetchBaseQuery({baseUrl: 'http://localhost:5000/api/'}),
        tagTypes: ["match"],
        endpoints: (builder) => ({
            getWeather: builder.query<WeatherForecast[], void>({
                query: () => 'weatherforecast',
            }),
            getPlayers: builder.query<Player[], void>({
                query: () => 'player',
                providesTags: ["match"]
            }),
            postMatch: builder.mutation<void, Match>({
                query: (match) => ({
                    url: 'match',
                    method: 'POST',
                    body: match
                }),
                invalidatesTags: ["match"]
            })
        }),
    }
)

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {useGetWeatherQuery, useGetPlayersQuery, usePostMatchMutation} = foosballApi