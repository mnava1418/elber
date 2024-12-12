import React, { useContext } from 'react'
import { View, Pressable } from 'react-native'
import AppIcon from './AppIcon'
import CustomText from './CustomText'
import { ElberVoice } from '../../../store/reducers/elber.reducer'
import { GlobalContext } from '../../../store/GlobalState'
import { setElberVoice } from '../../../store/actions/elber.actions'
import { globalStyles } from '../../../styles/mainStyles'
import { saveElberVoice } from '../../../services/voice.service'
import ElberModel from '../../../models/ElberModel'
import { selectAuthenticatedUser } from '../../../store/selectors/auth.selector'

type VoiceItemProps = {
    voice: ElberVoice
    isCurrentVoice: boolean
}

const VoiceItem = ({voice, isCurrentVoice}: VoiceItemProps) => {
    const {state, dispatch} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)

    const selectVoice = () => {
        dispatch(setElberVoice(voice))
        saveElberVoice(voice)
        setTimeout(() => {
            ElberModel.getInstance().speak(`Hola ${user.name}, ¿cómo te puedo ayudar?`)
        }, 300)
    }

    return (
        <Pressable 
            style={({pressed}) => ({opacity: pressed ? 0.8 : 1.0})}
            onPress={selectVoice}
        >
            <View style={[
                globalStyles.voiceItem,
                {justifyContent: isCurrentVoice ? 'space-between' : 'flex-start'}
            ]}
            >
                <CustomText>{voice.name}</CustomText>
                {isCurrentVoice ? <AppIcon name={'checkmark'} size={30} /> : <></>}
            </View>
        </Pressable>
    )
}

export default VoiceItem
