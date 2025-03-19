// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {WeatherForecast} from "./types";

// Define a service using a base URL and expected endpoints
export const foosballApi = createApi({
    reducerPath: 'foosballApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://localhost:7029/api/' }),
    endpoints: (builder) => ({
        getWeather: builder.query<WeatherForecast[], void>({
            query: () => 'weatherforecast',
        }),
    }),
})

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetWeatherQuery } = foosballApi