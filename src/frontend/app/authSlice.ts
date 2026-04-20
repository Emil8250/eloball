import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const authSlice = createSlice({
    name: 'auth',
    initialState: { forbidden: false },
    reducers: {
        setForbidden(state, action: PayloadAction<boolean>) {
            state.forbidden = action.payload
        },
    },
})

export const { setForbidden } = authSlice.actions
export default authSlice.reducer
