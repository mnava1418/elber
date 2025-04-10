import { ElberState, ElberVoice } from "../reducers/elber.reducer";

export const selectElberVoice = (state: ElberState):ElberVoice => state.elberVoice

export const selectElberIsProcessing = (state: ElberState):boolean => state.isProcessing