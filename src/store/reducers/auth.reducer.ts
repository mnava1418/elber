export type AuthState = {
    isAuthenticated: boolean,
    user: AuthUser
}

export type AuthUser ={
    name: string,
    email: string
}

export const initialAuthState: AuthState = {
    isAuthenticated: false,
    user: { name: '', email: '' }
}

export type AuthAction = 
| {type: 'SET_AUTHENTICATED', payload: boolean}
| {type: 'SET_AUTHENTICATED_USER', payload: AuthUser}
| {type: 'RESET_AUTH_STATE'}

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'SET_AUTHENTICATED':
            return {...state, isAuthenticated: action.payload}
        case 'SET_AUTHENTICATED_USER':
            return {...state, user: action.payload}
        case 'RESET_AUTH_STATE':
            return {...initialAuthState}
        default:
            return state
    }
}