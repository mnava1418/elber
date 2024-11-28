import { AuthState, AuthUser } from "../reducers/auth.reducer";

export const selectIsAuthenticated = (state: AuthState): boolean => state.isAuthenticated
export const selectAuthenticatedUser = (state: AuthState): AuthUser => state.user
