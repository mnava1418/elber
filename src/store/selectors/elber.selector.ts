import { ElberState, ElberVoice, EntitlementsAlert } from "../reducers/elber.reducer";

export const selectElberVoice = (state: ElberState):ElberVoice => state.elberVoice

export const selectElberIsProcessing = (state: ElberState):boolean => state.isProcessing

export const selectElberIsSpeaking = (state: ElberState):boolean => state.isSpeaking

export const selectEntitlementsAlert = (state: ElberState): EntitlementsAlert => state.entitlementsAlert