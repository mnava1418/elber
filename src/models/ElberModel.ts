import Tts, { ReactNativeTts, Voice } from "react-native-tts";
import { ElberVoice } from "../store/reducers/elber.reducer";

class ElberModel {

    private static instance: ElberModel
    private ElberTts: ReactNativeTts
    
    constructor() {        
        this.ElberTts = Tts
    }

    public static getInstance(): ElberModel {
        if(!ElberModel.instance) {
            ElberModel.instance = new ElberModel()
        }

        return ElberModel.instance
    }

    public setVoice(voice: ElberVoice) {
        if(voice.id.trim() !== '' && voice.language.trim() !== '') {
            this.ElberTts.setDefaultLanguage(voice.language)
            this.ElberTts.setDefaultVoice(voice.id)
        }        
    }

    public speak(message: string) {
        this.ElberTts.speak(message)
    }

    public async getAvailableVoices(): Promise<Voice[]> {
        const availableVoices: Voice[] = await this.ElberTts.voices()
        .catch(() => [])

        const spanishVoices = availableVoices.filter(voice => voice.language.trim().startsWith('es'))

        if(spanishVoices.length > 0) {
            return spanishVoices
        } else {
            const englishVoices = availableVoices.filter(voice => voice.language.trim() === 'en-US')       
            return englishVoices
        }
    }

    public getTts(): ReactNativeTts {
        return this.ElberTts
    }
}

export default ElberModel