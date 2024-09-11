import { AuthAction } from "../reducers/auth.reducer";

export const setIsAuthenticated = (isAuthenticated: boolean): AuthAction => ({
    type: 'SET_AUTHENTICATED',
    payload: isAuthenticated
})