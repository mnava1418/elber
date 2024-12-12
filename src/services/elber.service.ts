import {BACK_URL} from '@env'
import { getAxiosFetcher } from '../adapters/http/axios.fetcher'
import auth  from '@react-native-firebase/auth'
import { ChatMessageType } from '../interfaces/app.interface'
import { ElberResponse, ChatHistoryResponse } from '../interfaces/http.interface'

const httpFetcher = getAxiosFetcher(`${BACK_URL}:4042`)

export const sendElberMessage = async(chatMessage: ChatMessageType): Promise<ElberResponse> => {
    try {
        const currentUser = auth().currentUser

        if(currentUser === null) {
            throw new Error('User not authenticated.');
        }    

        const body = {id: chatMessage.id, query: chatMessage.text}
        const token = await currentUser.getIdToken(true)
        const data = await httpFetcher.post<ElberResponse>('/dialog', body, token)
        return data
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

export const generateChatMessage = (text: string, sender: 'user' | 'bot', isFavorite: boolean = false, id: string | null = null):ChatMessageType => {
    if(!id) {
        id = Date.now().toString()
    }

    const chatMessage: ChatMessageType = {isFavorite, text, sender, id};

    return chatMessage
}

export const loadChatMessages = async (lastKey: string | null = null): Promise<ChatHistoryResponse> => {
    console.log(BACK_URL)
    
    try {
        const token = await auth().currentUser?.getIdToken(true)
        .catch(() => {
            throw new Error('User not authenticated.');
        })

        const endpoint = lastKey ? `/chat?lastKey=${lastKey}` : '/chat'
        const data = await httpFetcher.get<ChatHistoryResponse>(endpoint, token)
        return data
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

export const deleteMessages = async(messageId: string | null = null) => {
    try {
        const token = await auth().currentUser?.getIdToken(true)
        .catch(() => {
            throw new Error('User not authenticated.');
        })

        const endpoint = messageId ? `/chat/${messageId}` : '/chat'
        await httpFetcher.delete(endpoint, token)
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

export const setIsFavorite = async (messageId:string, isFavorite: boolean) => {
    try {
        const token = await auth().currentUser?.getIdToken(true)
        .catch(() => {
            throw new Error('User not authenticated.');
        })

        await httpFetcher.post('/chat/isFavorite', {messageId, isFavorite}, token)
    } catch (error) {
        throw new Error((error as Error).message);
    }
}