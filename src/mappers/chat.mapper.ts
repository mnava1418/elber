import { ChatHistoryType, ChatMessageType } from "../interfaces/app.interface";
import { ChatHistoryResponse } from "../interfaces/http.interface";

class ChatMapper {
    static mapChatHistory(response: ChatHistoryResponse): ChatHistoryType {
        const chatHistory:ChatMessageType[] = []
        Object.keys(response.messages).forEach(key => {
            chatHistory.unshift({...response.messages[key], id: key})
        })

        return {lastKey: response.lastKey, messages: chatHistory}
    }
}

export default ChatMapper