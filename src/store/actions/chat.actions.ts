import { ChatMessageType } from "../../interfaces/app.interface";
import { ChatAction } from "../reducers/chat.reducer";

export const setChatMessages = (chatInfo: {messages: ChatMessageType[], lastKey: null | string}): ChatAction => ({
    type: 'LOAD_MESSAGES',
    payload: chatInfo
})

export const setNewMessage = (message: ChatMessageType): ChatAction => ({
    type: 'ADD_MESSAGE',
    payload: message
})