import { ChatState, SelectedMessage } from "../reducers/chat.reducer";

export const selectChatHistory = (state: ChatState): ChatState => state

export const selectSelectedMeasure = (state: ChatState): SelectedMessage | null => state.selectedMessage

export const selectShowFavorites = (state: ChatState): boolean => state.showFavorites