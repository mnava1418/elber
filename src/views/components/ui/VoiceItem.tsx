import React, { useContext } from 'react'
import { View, Pressable } from 'react-native'
import AppIcon from './AppIcon'
import CustomText from './CustomText'
import { ElberVoice } from '../../../store/reducers/elber.reducer'
import { GlobalContext } from '../../../store/GlobalState'
import { setElberVoice } from '../../../store/actions/elber.actions'
import { globalStyles } from '../../../styles/mainStyles'

type VoiceItemProps = {
    voice: ElberVoice
    isCurrentVoice: boolean
}

const VoiceItem = ({voice, isCurrentVoice}: VoiceItemProps) => {
    const {dispatch} = useContext(GlobalContext)

    const selectVoice = () => {
        dispatch(setElberVoice(voice))
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
