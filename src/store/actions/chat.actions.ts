import { ChatMessageType } from "../../interfaces/app.interface";
import { ChatAction } from "../reducers/chat.reducer";

export const setChatMessages = (messages: ChatMessageType[]): ChatAction => ({
    type: 'LOAD_MESSAGES',
    payload: messages
})