export type ElberVoice = {
    id: string,
    language: string,
    name: string
}

export type ElberState = {
    elberVoice: ElberVoice,
    isProcessing: boolean,
    isSpeaking: boolean,
}

export const initialElberState: ElberState = {
    elberVoice: {id: '', name: '', language: ''},
    isProcessing: false,
    isSpeaking: false
}

export type ElberAction = 
| {type: 'SET_ELBER_VOICE', payload: ElberVoice}
| {type: 'SET_ELBER_PROCESSING', payload: boolean}
| {type: 'SET_ELBER_SPEAKING', payload: boolean}
| {type: 'RESET_ELBER_STATE'}

export const elberReducer = (state: ElberState, action: ElberAction): ElberState => {
    switch (action.type) {
        case 'SET_ELBER_VOICE':
            return {...state, elberVoice: action.payload}
        case 'SET_ELBER_PROCESSING':
            return {...state, isProcessing: action.payload}
        case 'SET_ELBER_SPEAKING':
            return {...state, isSpeaking: action.payload}
        case 'RESET_ELBER_STATE':
            return {...initialElberState}
        default:
            return state
    }
}