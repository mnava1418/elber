import Tts, { ReactNativeTts, Voice } from "react-native-tts";
import { ElberVoice } from "../store/reducers/elber.reducer";

class ElberModel {

    private static instance: ElberModel
    
    constructor() {            
    }

    public static getInstance(): ElberModel {
        if(!ElberModel.instance) {
            ElberModel.instance = new ElberModel()
        }

        return ElberModel.instance
    }

    public async setVoice(voice: ElberVoice) {
        if(voice.id.trim() !== '' && voice.language.trim() !== '') {
            await Tts.setDefaultLanguage(voice.language)
            await Tts.setDefaultVoice(voice.id)
        }        
    }

    public speak(message: string) {
        Tts.speak(message)
    }

    public async getAvailableVoices(): Promise<Voice[]> {
        const availableVoices: Voice[] = await Tts.voices()
        .catch(() => [])

        const spanishVoices = availableVoices.filter(voice => voice.language.trim() === 'es-MX')

        if(spanishVoices.length > 0) {
            return spanishVoices
        } else {
            const englishVoices = availableVoices.filter(voice => voice.language.trim() === 'en-US')       
            return englishVoices
        }
    }

    public addListeners(onStartSpeaking: () => void, onSpeaking: () => void, onFinishSpeaking: () => void  ) {
        Tts.addEventListener('tts-start', onStartSpeaking)
        Tts.addEventListener('tts-progress', onSpeaking)
        Tts.addEventListener('tts-finish', onFinishSpeaking)
    }

    public removeListeners() {
        Tts.removeAllListeners('tts-start')
        Tts.removeAllListeners('tts-progress')
        Tts.removeAllListeners('tts-finish')
    }
}

export default ElberModel