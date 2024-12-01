export type ElberState = {
    elberVoice: string
}

export const initialElberState: ElberState = {
    elberVoice: ''
}

export type ElberAction = 
| {type: 'SET_ELBER_VOICE', payload: string}
| {type: 'RESET_ELBER_STATE'}

export const elberReducer = (state: ElberState, action: ElberAction): ElberState => {
    switch (action.type) {
        case 'SET_ELBER_VOICE':
            return {...state, elberVoice: action.payload}
        case 'RESET_ELBER_STATE':
            return {...initialElberState}
        default:
            return state
    }
}