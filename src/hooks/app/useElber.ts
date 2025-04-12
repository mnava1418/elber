import { useContext, useRef, useState } from 'react'
import Voice from '@react-native-voice/voice'
import { ElberState } from '../../store/reducers/elber.reducer';
import usePulseImage from '../animations/usePulseImage';
import { checkVoicePermissions } from '../../services/entitlements.service';
import { Platform } from 'react-native';
import { GlobalContext } from '../../store/GlobalState';
import useSpinImage from '../animations/useRotateImage';
import SocketModel from '../../models/Socket.model';
import { selectElberIsProcessing, selectElberIsSpeaking } from '../../store/selectors/elber.selector';

const useElber = (state: ElberState) => {
    const isElberProcessing = selectElberIsProcessing(state)
    const isElberSpeaking = selectElberIsSpeaking(state)
    const [prompt, setPrompt] = useState('')
    const [alertVisible, setAlertVisible] = useState(false)
    const silenceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListening = useRef(false)
    const promptRef = useRef('')    
    const {pulseImage, scaleImage} = usePulseImage(400, 1.1)
    const {spinImage, spinAnimation} = useSpinImage()
    const {dispatch} = useContext(GlobalContext)

    const clearSilenceTimeout = () => {
        if (silenceTimeout.current) {
          clearTimeout(silenceTimeout.current)
          silenceTimeout.current = null
        }
    };

    const resetSilenceTimeout = () => {
        if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current)
        }

        silenceTimeout.current = setTimeout(() => {
            if (isListening.current) {                
                stopListening()
            }
        }, 2500)
    };

    const sendMessage = async () => {
        if (promptRef.current.trim() === '') return;
        
        SocketModel.getInstance().sendMessage(dispatch, promptRef.current, 'voice')
    }

    const startListening = async () => {
        if(isElberProcessing || isElberSpeaking) {            
            return
        }

        const hasVoicePermissions = await checkVoicePermissions(Platform.OS === 'ios' ? 'ios' : 'android')
        .catch(() => false)

        if(hasVoicePermissions) {
            try {
                setPrompt('')
                promptRef.current = ''
                pulseImage.start()
                await Voice.start('es-MX')
            } catch (error) {
                console.log('Error 1')
                //ElberModel.getInstance().speak('Lo siento, no puedo escucharte. Intenta de nuevo')
            }
        } else {
            setAlertVisible(true)
        }
    }

    const stopListening = async() => {
        try {
            pulseImage.reset()
            isListening.current = false
            clearSilenceTimeout()
            await Voice.stop()            
        } catch (error) {
            console.log('Error 2')
            //ElberModel.getInstance().speak('Lo siento, no puedo escucharte. Intenta de nuevo')
        }
    }

    const prepareSpeech = () => {
        Voice.onSpeechStart = () => {
            isListening.current = true
            resetSilenceTimeout()
        }

        Voice.onSpeechEnd = () => {
            isListening.current = false
            sendMessage()
        }

        Voice.onSpeechResults = (event) => {
            if(event.value) {
                setPrompt(event.value[0])
                promptRef.current = event.value[0]
            }
        }

        Voice.onSpeechPartialResults = () => {
            if(isListening.current) {
                resetSilenceTimeout()
            }
        }

        Voice.onSpeechError = (error) => {            
            isListening.current = false
            console.log('Error 3')
            //ElberModel.getInstance().speak('No te escuché! ¿Me lo repites, porfa?')
        };
    }

    const removeSpeechListener = () => {
        Voice.destroy().then(Voice.removeAllListeners)        
    }
    
    return {
        isListening, promptRef, scaleImage, isElberProcessing,
        prepareSpeech, removeSpeechListener,
        stopListening, startListening,
        prompt, setPrompt,
        alertVisible, setAlertVisible,
        spinImage, spinAnimation
    }
}

export default useElber