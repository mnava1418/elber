import {BACK_URL} from '@env'
import { getAxiosFetcher } from '../adapters/http/axios.fetcher'
import auth  from '@react-native-firebase/auth'
import { ChatHistoryType, ChatMessageType } from '../interfaces/app.interface'
import { ElberResponse, ChatHistoryResponse } from '../interfaces/http.interface'
import ChatMapper from '../mappers/chat.mapper'

const httpFetcher = getAxiosFetcher(`${BACK_URL}:4042`)

export const sendElberMessage = async(chatMessage: ChatMessageType): Promise<ElberResponse> => {
    try {
        const currentUser = auth().currentUser

        if(currentUser === null) {
            throw new Error('User not authenticated.');
        }    

        const body = {id: chatMessage.id, query: chatMessage.message}
        const token = await currentUser.getIdToken(true)
        const data = await httpFetcher.post<ElberResponse>('/dialog', body, token)
        return data
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

export const generateChatMessage = (message: string, sender: 'user' | 'bot', isFavorite: boolean = false, id: string | null = null):ChatMessageType => {
    if(!id) {
        id = Date.now().toString()
    }

    const chatMessage: ChatMessageType = {isFavorite, message, sender, id};

    return chatMessage
}

export const loadChatMessages = async (lastKey: string | null = null): Promise<ChatHistoryType> => {
    try {
        const token = await auth().currentUser?.getIdToken(true)
        .catch(() => {
            throw new Error('User not authenticated.');
        })

        const endpoint = lastKey ? `/chat?lastKey=${lastKey}` : '/chat'
        const data = await httpFetcher.get<ChatHistoryResponse>(endpoint, token)
        return ChatMapper.mapChatHistory(data)
    } catch (error) {
        throw new Error((error as Error).message);
    }
}