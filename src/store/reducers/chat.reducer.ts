import { ChatMessageType } from "../../interfaces/app.interface"

export type ChatState = {
    chatMessages: ChatMessageType[],
    lastKey: null | string
}

export const initialChatState: ChatState = {
    chatMessages: [],
    lastKey: null
}

export type ChatAction = 
| {type: 'LOAD_MESSAGES', payload: ChatMessageType[]}
| {type: 'SET_LAST_KEY', payload: null | string}
| {type: 'ADD_MESSAGE', payload: ChatMessageType}

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case 'LOAD_MESSAGES':
            return {...state, chatMessages: [...state.chatMessages, ...action.payload]}
        case 'SET_LAST_KEY':
            return {...state, lastKey: action.payload}
        case 'ADD_MESSAGE':
            return {...state, chatMessages: [action.payload, ...state.chatMessages]}
        default:
            return state
    }
}