export type AuthState = {
    isAuthenticated: boolean
}

export const initialAuthState: AuthState = {
    isAuthenticated: false
}

export type AuthAction = 
| {type: 'SET_AUTHENTICATED', payload: boolean}

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'SET_AUTHENTICATED':
            return {...state, isAuthenticated: action.payload}
        default:
            return state
    }
}