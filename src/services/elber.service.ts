import Sound from 'react-native-sound'
import RNFetchBlob from 'react-native-blob-util'
import {BACK_URL} from '@env'
import { Buffer } from 'buffer'
import { getAxiosFetcher } from '../adapters/http/axios.fetcher'
import auth  from '@react-native-firebase/auth'
import { ChatMessageType } from '../interfaces/app.interface'
import { ElberResponse, ChatHistoryResponse } from '../interfaces/http.interface'
import * as chatActions from '../store/actions/chat.actions'
import * as elberActions from '../store/actions/elber.actions'

const httpFetcher = getAxiosFetcher(`${BACK_URL}:4042`)
Sound.setCategory('Playback')

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

export const processTextResponse = (dispatch: (value: any) => void, responseText: string) => {
    const botMessage = generateChatMessage(responseText, 'bot', false)
    dispatch(chatActions.setNewMessage(botMessage))
    dispatch(elberActions.setElberIsProcessing(false))
}

export const processAudioResponse = async (dispatch: (value: any) => void, audioChunks: Uint8Array[], responseText: string) => {
    const botMessage = generateChatMessage(responseText, 'bot', false)
    dispatch(chatActions.setNewMessage(botMessage))
    dispatch(elberActions.setElberIsProcessing(false))
    dispatch(elberActions.setElberIsSpeaking(true))

    const fullBuffer = Buffer.concat(audioChunks.map((chunk) => Buffer.from(chunk)))
    const path = `${RNFetchBlob.fs.dirs.CacheDir}/elber-voice-${Date.now()}.mp3`
    
    await RNFetchBlob.fs.writeFile(path, fullBuffer.toString("base64"), "base64");
    
    const sound = new Sound(path, '', (error) => {
        if(!error) {
            sound.play(() => {           
                dispatch(elberActions.setElberIsSpeaking(false))
                sound.release()                
            })
        } else {
            dispatch(elberActions.setElberIsSpeaking(false))
        } 
    })
}
