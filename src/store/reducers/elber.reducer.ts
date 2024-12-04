export type ElberVoice = {
    id: string,
    language: string,
    name: string
}

export type ElberState = {
    elberVoice: ElberVoice
}

export const initialElberState: ElberState = {
    elberVoice: {id: '', name: '', language: ''}
}

export type ElberAction = 
| {type: 'SET_ELBER_VOICE', payload: ElberVoice}
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