import { configureStore } from '@reduxjs/toolkit'
// Or from '@reduxjs/toolkit/query/react'
import { setupListeners } from '@reduxjs/toolkit/query'
import {foosballApi} from "../apis/foosball/foosball";

export const store = configureStore({
    reducer: {
        [foosballApi.reducerPath]: foosballApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(foosballApi.middleware),
})

setupListeners(store.dispatch)