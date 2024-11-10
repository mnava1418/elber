export type ChatMessageType = {
    message: string;
    sender: 'user' | 'bot'
    isFavorite: boolean
    id?: string
}

export type ChatHistoryType = {
    messages: ChatMessageType[]
    lastKey: string | null
}