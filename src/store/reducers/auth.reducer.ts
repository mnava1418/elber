export type AuthState = {
    isAuthenticated: boolean,
    user: AuthUser
    permissions: AuthPermissions
}

export type AuthUser ={
    name: string,
    email: string
}

export type AuthPermissions = {
    microphonePermission: boolean,
    speechRecognitionPermission: boolean
}

export const initialAuthState: AuthState = {
    isAuthenticated: false,
    user: { name: '', email: '' },
    permissions: {microphonePermission: false, speechRecognitionPermission: false}
}

export type AuthAction = 
| {type: 'SET_AUTHENTICATED', payload: boolean}
| {type: 'SET_AUTHENTICATED_USER', payload: AuthUser}
| {type: 'SET_PERMISSIONS', payload: AuthPermissions}
| {type: 'RESET_AUTH_STATE'}

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'SET_AUTHENTICATED':
            return {...state, isAuthenticated: action.payload}
        case 'SET_AUTHENTICATED_USER':
            return {...state, user: action.payload}
        case 'SET_PERMISSIONS':
            return {...state, permissions: action.payload}
        case 'RESET_AUTH_STATE':
            return {...initialAuthState}
        default:
            return state
    }
}