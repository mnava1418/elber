export type ElberVoice = {
    id: string,
    language: string,
    name: string
}

export type EntitlementsAlert = {
    isVisible: boolean,
    title: string,
    text: string
}

export type ElberState = {
    elberVoice: ElberVoice,
    isProcessing: boolean,
    isSpeaking: boolean,
    entitlementsAlert: EntitlementsAlert,
}

export const initialElberState: ElberState = {
    elberVoice: {id: '', name: '', language: ''},
    isProcessing: false,
    isSpeaking: false,
    entitlementsAlert: {isVisible: false, title: '', text: ''}
}

export type ElberAction = 
| {type: 'SET_ELBER_VOICE', payload: ElberVoice}
| {type: 'SET_ELBER_PROCESSING', payload: boolean}
| {type: 'SET_ELBER_SPEAKING', payload: boolean}
| {type: 'SET_ENTITLEMENTS_ALERT', payload: EntitlementsAlert}
| {type: 'RESET_ELBER_STATE'}

export const elberReducer = (state: ElberState, action: ElberAction): ElberState => {
    switch (action.type) {
        case 'SET_ELBER_VOICE':
            return {...state, elberVoice: action.payload}
        case 'SET_ELBER_PROCESSING':
            return {...state, isProcessing: action.payload}
        case 'SET_ELBER_SPEAKING':
            return {...state, isSpeaking: action.payload}
        case 'SET_ENTITLEMENTS_ALERT':
            return {...state, entitlementsAlert: action.payload}
        case 'RESET_ELBER_STATE':
            return {...initialElberState}
        default:
            return state
    }
}