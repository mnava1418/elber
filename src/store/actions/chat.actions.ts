import { ChatMessageType } from "../../interfaces/app.interface";
import { ChatAction, SelectedMessage } from "../reducers/chat.reducer";

export const setChatMessages = (chatMessages: ChatMessageType[], reload = false): ChatAction => ({
    type: 'LOAD_MESSAGES',
    payload: {
        messages: chatMessages,
        reload
    }
})

export const setLastKey = (lastKey: null | string): ChatAction => ({
    type: 'SET_LAST_KEY',
    payload: lastKey
})

export const setNewMessage = (message: ChatMessageType): ChatAction => ({
    type: 'ADD_MESSAGE',
    payload: message
})

export const deleteAllMessages = (): ChatAction => ({
    type: 'DELETE_ALL'
})

export const setSelectedMeasure = (selectedMeasure: SelectedMessage): ChatAction => ({
    type: 'SET_SELECTED_MESSAGE',
    payload: selectedMeasure
})

export const deleteMessageById = (messageId: string): ChatAction => ({
    type: 'DELETE_MESSAGE',
    payload: messageId
})

export const setIsFavoriteMessage = (messageId: string): ChatAction => ({
    type: 'FAVORITE_MESSAGE',
    payload: messageId
})

export const setShowFavorites = (): ChatAction => ({
    type: 'SET_SHOW_FAVORITE'
})

export const resetChatState = (): ChatAction => ({
    type: 'RESET_CHAT_STATE'
})