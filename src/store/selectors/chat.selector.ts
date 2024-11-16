import { ChatState, MessageMeasure } from "../reducers/chat.reducer";

export const selectChatHistory = (state: ChatState): ChatState => state
export const selectSelectedMeasure = (state: ChatState): MessageMeasure | null => state.selectedMeasure