import { AuthState } from "../reducers/auth.reducer";

export const selectIsAuthenticated = (state: AuthState): boolean => state.isAuthenticated