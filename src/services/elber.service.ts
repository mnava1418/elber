import {BACK_URL} from '@env'
import { getAxiosFetcher } from '../adapters/http/axios.fetcher'
import auth  from '@react-native-firebase/auth'
import { ChatMessageType } from '../interfaces/app.interface'

const httpFetcher = getAxiosFetcher(`${BACK_URL}:4042`)

export const sendElberMessage = async(query: string) => {
    try {
        const currentUser = auth().currentUser

        if(currentUser === null) {
            throw new Error('User not authenticated.');
        }    

        const token = await currentUser.getIdToken()
        const data = await httpFetcher.post<ElberResponse>('/dialog', {query}, token)
        return data.responseText
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

export const generateChatMessage = (message: string, sender: 'user' | 'bot'):ChatMessageType => {
    const chatMessage: ChatMessageType = {
        id: Math.random().toString(36).substring(7),
        text: message,
        sender: sender,
    };

    return chatMessage
}