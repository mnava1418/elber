import { AuthAction, AuthUser } from "../reducers/auth.reducer";

export const setIsAuthenticated = (isAuthenticated: boolean): AuthAction => ({
    type: 'SET_AUTHENTICATED',
    payload: isAuthenticated
})

export const setAuthenticatedUser = (user: AuthUser): AuthAction => ({
    type: 'SET_AUTHENTICATED_USER',
    payload: user
})

export const resetAuthState = (): AuthAction => ({
    type: 'RESET_AUTH_STATE'
})