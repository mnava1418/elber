import { ElberAction, ElberVoice } from "../reducers/elber.reducer";

export const setElberVoice = (elberVoice: ElberVoice): ElberAction => ({
    type: 'SET_ELBER_VOICE',
    payload: elberVoice
})
    
export const resetElberState = (): ElberAction => ({
    type: 'RESET_ELBER_STATE'
})
