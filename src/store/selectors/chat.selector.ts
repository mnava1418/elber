import { ChatState, SelectedMessage } from "../reducers/chat.reducer";

export const selectChatHistory = (state: ChatState): ChatState => {
    let chatMessages = [...state.chatMessages]

    if(state.showFavorites) {
        chatMessages = chatMessages.filter(message => message.isFavorite)
    }

    return {...state, chatMessages}
}

export const selectSelectedMeasure = (state: ChatState): SelectedMessage | null => state.selectedMessage