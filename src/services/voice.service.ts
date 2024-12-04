import { Voice } from "react-native-tts"
import ElberModel from "../models/ElberModel"
import { loadData } from "./localStorage.service"
import { ElberVoice } from "../store/reducers/elber.reducer"

export const getElberVoice = async (): Promise<ElberVoice> => {
    let savedVoice = await loadData('elberVoice')
    .catch (() => null)

    let elberVoice: ElberVoice

    if(savedVoice === null) {
        const defaultVoice = await getDefaultVoice() 
        elberVoice = parseElberVoice(defaultVoice)
        
    } else {
        console.log('Si tenemos voz')
        elberVoice = parseElberVoice(JSON.parse(savedVoice))
    }

    return elberVoice
}

const getDefaultVoice = async (): Promise<ElberVoice | null> => {
    const availableVoices: Voice[] = await ElberModel.getInstance().getAvailableVoices()
    .catch(() => [])

    if(availableVoices.length > 0) {
        const defaultVoice = availableVoices[0]
        return {id: defaultVoice.id, name: defaultVoice.name, language: defaultVoice.language}
    }

    return null
}

const parseElberVoice = (voice: any): ElberVoice => {
    if(voice === null ) {
        return {id: '', language: '', name: ''}
    }

    return {
        id: voice.id ?? '',
        name: voice.name ?? '',
        language: voice.language ?? ''
    }    
}