import { ElberAction } from "../reducers/elber.reducer";

export const setElberVoice = (elberVoice: string): ElberAction => ({
    type: 'SET_ELBER_VOICE',
    payload: elberVoice
})
    
export const resetElberState = (): ElberAction => ({
    type: 'RESET_ELBER_STATE'
})
