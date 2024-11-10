import { ChatHistoryType, ChatMessageType } from "../../interfaces/app.interface"

export interface ChatState extends ChatHistoryType {
}

export const initialChatState: ChatState = {
    messages: [],
    lastKey: null
}

export type ChatAction = 
| {type: 'LOAD_MESSAGES', payload: ChatMessageType[]}
| {type: 'ADD_MESSAGE', payload: ChatMessageType}

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case 'LOAD_MESSAGES':
            return {...state, messages: [...action.payload, ...state.messages]}
        case 'ADD_MESSAGE':
            return {...state, messages: [action.payload, ...state.messages]}
        default:
            return state
    }
}