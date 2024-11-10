import { ChatMessageType } from "../../interfaces/app.interface";
import { ChatState } from "../reducers/chat.reducer";

export const selectChatMessages = (state: ChatState): ChatMessageType[] => state.messages