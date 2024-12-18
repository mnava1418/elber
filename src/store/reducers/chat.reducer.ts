import { ChatMessageType } from "../../interfaces/app.interface"

export type ChatState = {
    chatMessages: ChatMessageType[],
    lastKey: null | string
    selectedMessage: null | SelectedMessage,
    showFavorites: boolean
}

export type SelectedMessage = {
    layout: {
        px: number,
        py: number,
        pv: 'right' | 'left'
        height: number,
    },
    content: ChatMessageType
}

export const initialChatState: ChatState = {
    chatMessages: [],
    lastKey: null,
    selectedMessage: null,
    showFavorites: false
}

export type ChatAction = 
| {type: 'LOAD_MESSAGES', payload: {messages: ChatMessageType[], reload: boolean}}
| {type: 'SET_LAST_KEY', payload: null | string}
| {type: 'ADD_MESSAGE', payload: ChatMessageType}
| {type: 'SET_SELECTED_MESSAGE', payload: SelectedMessage}
| {type: 'DELETE_MESSAGE', payload: string}
| {type: 'FAVORITE_MESSAGE', payload: string}
| {type: 'DELETE_ALL'}
| {type: 'SET_SHOW_FAVORITE'}
| {type: 'RESET_CHAT_STATE'}

const deleteMessage = (state: ChatState, messageId: string): ChatState => {
    const newMessages = [...state.chatMessages].filter(message => message.id !== messageId)
    return {...state, chatMessages: newMessages}
}

const setIsFavorite = (state: ChatState, messageId: string): ChatState => {
    const newMessages = state.chatMessages.map((message) => {
        if(message.id === messageId) {
            message.isFavorite = !message.isFavorite
        }

        return message
    })

    return {...state, chatMessages: newMessages}
}

const loadMessages = (state: ChatState, messages: ChatMessageType[], reload: boolean ): ChatState => {
    if(reload) {
        return {...state, chatMessages: [...messages]}
    } else {
        return {...state, chatMessages: [...state.chatMessages, ...messages]}
    }
}

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
        case 'LOAD_MESSAGES':
            return (loadMessages(state, action.payload.messages, action.payload.reload ))
        case 'SET_LAST_KEY':
            return {...state, lastKey: action.payload}
        case 'ADD_MESSAGE':
            return {...state, chatMessages: [action.payload, ...state.chatMessages]}
        case 'DELETE_ALL':
            return {...state, chatMessages:[]}
        case 'SET_SELECTED_MESSAGE':
            return {...state, selectedMessage: action.payload}
        case 'DELETE_MESSAGE':
            return (deleteMessage(state, action.payload))
        case 'FAVORITE_MESSAGE':
            return (setIsFavorite(state, action.payload))
        case 'SET_SHOW_FAVORITE':
            return {...state, showFavorites: !state.showFavorites}
        case 'RESET_CHAT_STATE':
            return {...initialChatState}
        default:
            return state
    }
}