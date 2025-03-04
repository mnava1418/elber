import { useContext, useRef, useState } from 'react'
import Voice from '@react-native-voice/voice'
import { ElberState } from '../../store/reducers/elber.reducer';
import { selectElberVoice } from '../../store/selectors/elber.selector';
import usePulseImage from '../animations/usePulseImage';
import { checkVoicePermissions } from '../../services/entitlements.service';
import { Platform } from 'react-native';
import ElberModel from '../../models/ElberModel';
import * as elberService from '../../services/elber.service'
import { GlobalContext } from '../../store/GlobalState';
import { setNewMessage } from '../../store/actions/chat.actions';
import useSpinImage from '../animations/useRotateImage';

const useElber = (state: ElberState) => {
    const [prompt, setPrompt] = useState('')
    const [alertVisible, setAlertVisible] = useState(false)
    const silenceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isListening = useRef(false)
    const promptRef = useRef('')
    const elberVoice = selectElberVoice(state)
    const {pulseImage, scaleImage} = usePulseImage(400, 1.1)
    const {spinImage, spinAnimation} = useSpinImage()
    const isSpeaking = useRef(false)
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

        spinAnimation.start()

        const userMessage = elberService.generateChatMessage(promptRef.current, 'user')
        dispatch(setNewMessage(userMessage))
        
        const botMessage = await elberService.sendElberMessage(userMessage)
        .then(result => {
            return elberService.generateChatMessage(result.responseText, 'bot', false, result.id)
        })
        .catch(error => {
            return elberService.generateChatMessage('Perdón mi hermano, está cosa tronó. Intenta nuevamente', 'bot')
        })
        .finally(() => {
            spinAnimation.reset()
        })

        dispatch(setNewMessage(botMessage))
        ElberModel.getInstance().speak(botMessage.text)
    }

    const startListening = async () => {
        if(isSpeaking.current) {
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
                ElberModel.getInstance().speak('Lo siento, no puedo escucharte. Intenta de nuevo')
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
            ElberModel.getInstance().speak('Lo siento, no puedo escucharte. Intenta de nuevo')
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
            ElberModel.getInstance().speak('No te escuché! ¿Me lo repites, porfa?')
        };

        ElberModel.getInstance().addListeners(onStartSpeaking, onSpeaking, onFinishSpeaking)
    }

    const onStartSpeaking = () => {
        isSpeaking.current = true
    }

    const onSpeaking = () => {}

    const onFinishSpeaking = () => {
        isSpeaking.current = false
    }

    const removeSpeechListener = () => {
        Voice.destroy().then(Voice.removeAllListeners)
        ElberModel.getInstance().removeListeners()
    }
    
    return {
        isListening, promptRef, elberVoice, scaleImage, spinImage,
        prepareSpeech, removeSpeechListener,
        stopListening, startListening,
        prompt, setPrompt,
        alertVisible, setAlertVisible
    }
}

export default useElber