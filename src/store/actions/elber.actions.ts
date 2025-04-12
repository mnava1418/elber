import { ElberAction, ElberVoice } from "../reducers/elber.reducer";

export const setElberVoice = (elberVoice: ElberVoice): ElberAction => ({
    type: 'SET_ELBER_VOICE',
    payload: elberVoice
})
    
export const resetElberState = (): ElberAction => ({
    type: 'RESET_ELBER_STATE'
})

export const setElberIsProcessing = (isProcessing: boolean): ElberAction => ({
    type: 'SET_ELBER_PROCESSING',
    payload: isProcessing
})

export const setElberIsSpeaking = (isSpeaking: boolean): ElberAction => ({
    type: 'SET_ELBER_SPEAKING',
    payload: isSpeaking
})