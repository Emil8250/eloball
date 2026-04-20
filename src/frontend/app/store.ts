import { configureStore, isRejectedWithValue, type Middleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { foosballApi } from '../apis/foosball/foosball'
import authReducer, { setForbidden } from './authSlice'

const forbiddenMiddleware: Middleware = (api) => (next) => (action) => {
    if (isRejectedWithValue(action) && (action.payload as { status?: number })?.status === 403) {
        api.dispatch(setForbidden(true))
    }
    return next(action)
}

export const store = configureStore({
    reducer: {
        [foosballApi.reducerPath]: foosballApi.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(foosballApi.middleware, forbiddenMiddleware),
})

export type RootState = ReturnType<typeof store.getState>

setupListeners(store.dispatch)
