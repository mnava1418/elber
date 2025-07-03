import Sound from 'react-native-sound'
import RNFetchBlob from 'react-native-blob-util'
import {BACK_URL} from '@env'
import { Buffer } from 'buffer'
import { getAxiosFetcher } from '../adapters/http/axios.fetcher'
import auth  from '@react-native-firebase/auth'
import { AudioErrorKey, ChatMessageType } from '../interfaces/app.interface'
import { ChatHistoryResponse } from '../interfaces/http.interface'
import * as chatActions from '../store/actions/chat.actions'
import * as elberActions from '../store/actions/elber.actions'
import { GeneralPayload, NLPActions, NLPResponse } from '../interfaces/nlp.interface'
import { openCamera } from './vision.service'


const httpFetcher = getAxiosFetcher(BACK_URL)
Sound.setCategory('Playback')

const audios: Record<AudioErrorKey, any> = {
    'responseError': require('../assets/audios/responseError.mp3'),
    'voiceError': require('../assets/audios/voiceError.mp3'),
    'connectionError': require('../assets/audios/connectionError.mp3'),
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

        const endpoint = lastKey ? `/ai/chat?lastKey=${lastKey}` : '/ai/chat'
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

        const endpoint = messageId ? `/ai/chat/${messageId}` : '/ai/chat'
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

        await httpFetcher.post('/ai/chat/isFavorite', {messageId, isFavorite}, token)
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

export const processElberResponse = (dispatch: (value: any) => void, elberResponse: NLPResponse, audioChunks: Uint8Array[]) => {
    switch (elberResponse.action) {
        case NLPActions.SHOW_TEXT:
            processTextResponse(dispatch, elberResponse.payload)
            break;
        case NLPActions.PLAY_AUDIO:
            processAudioResponse(dispatch, elberResponse.payload, audioChunks)
            break;
        case NLPActions.OPEN_CAMERA:            
            openCamera(dispatch)
            break;
        default:
            break;
    }
}

const processTextResponse = (dispatch: (value: any) => void, payload: GeneralPayload) => {
    const botMessage = generateChatMessage(payload.text, 'bot', false)
    dispatch(chatActions.setNewMessage(botMessage))
    dispatch(elberActions.setElberIsProcessing(false))
}

const processAudioResponse = async (dispatch: (value: any) => void, payload: GeneralPayload, audioChunks: Uint8Array[]) => {
    const botMessage = generateChatMessage(payload.text, 'bot', false)
    dispatch(chatActions.setNewMessage(botMessage))    
    dispatch(elberActions.setElberIsSpeaking(true))

    if(payload.errorKey) {
        const sound = new Sound(audios[payload.errorKey], (error) => {
            handleSound(dispatch, sound, error)
        })
    } else {
        const fullBuffer = Buffer.concat(audioChunks.map((chunk) => Buffer.from(chunk)))
        const path = `${RNFetchBlob.fs.dirs.CacheDir}/elber-voice-${Date.now()}.mp3`
        await RNFetchBlob.fs.writeFile(path, fullBuffer.toString("base64"), "base64");

        const sound = new Sound(path, '', (error) => {
            handleSound(dispatch, sound, error)
        })
    }
}

const handleSound = (dispatch: (value: any) => void, sound: Sound, error: any) => {
    dispatch(elberActions.setElberIsProcessing(false))
    if(!error) {
        sound.play(() => {           
            dispatch(elberActions.setElberIsSpeaking(false))
            sound.release()                
        })
    } else {
        dispatch(elberActions.setElberIsSpeaking(false))
    } 
}
