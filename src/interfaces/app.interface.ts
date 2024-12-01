export type ChatMessageType = {
    text: string;
    sender: 'user' | 'bot'
    isFavorite: boolean
    id: string
}

export type ChatHistoryType = {
    messages: ChatMessageType[]
    lastKey: string | null
}

export type ChatActionType =  {
    text: string,
    icon: string,
    type: 'delete' | 'copy' | 'share' | 'favorite'
}

export type LocalStorageKey = 'elberVoice'