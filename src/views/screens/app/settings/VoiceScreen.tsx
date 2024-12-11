import { NavigationProp, useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect, useState } from 'react'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import NavBarBackBtn from '../../../components/navBar/NavBarBackBtn'
import MainView from '../../../components/ui/MainView'
import { SettingsNavigationProps } from './SettingsNavigation'
import { FlatList, View } from 'react-native'
import { Voice } from 'react-native-tts'
import ElberModel from '../../../../models/ElberModel'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { globalColors } from '../../../../styles/mainStyles'
import { GlobalContext } from '../../../../store/GlobalState'
import useElber from '../../../../hooks/app/useElber'
import VoiceItem from '../../../components/ui/VoiceItem'

const VoiceScreen = () => {
    const navigation = useNavigation<NavigationProp<SettingsNavigationProps>>()
    const leftBtn = NavBarBackBtn(navigation)
    const {bottom, top} = useSafeAreaInsets()
    
    const [voices, setVoices] = useState<Voice[]>([])

    const {state} = useContext(GlobalContext)
    const {elberVoice} = useElber(state.elber)

    useEffect(() => {
        ElberModel.getInstance().getAvailableVoices()
        .then(result => {
            setVoices(result)}
        )
        .catch(() => {setVoices([])})
    }, [])
    
    return (
        <MainView>
            <CustomNavBar leftBtn={leftBtn} title='Voz'/>
            <View style={{flex: 1, marginBottom: bottom + 8, marginTop: top + 72, backgroundColor: globalColors.primary, borderRadius: 15}}>
                <FlatList
                    data={voices}
                    renderItem={({item}) => (
                        <VoiceItem 
                            key={item.id}
                            voice={{id: item.id, name: item.name, language: item.language}} 
                            isCurrentVoice={item.id === elberVoice.id}
                        />
                    )}
                    keyExtractor={(item,index) => `${item.id}-${index}`}
                    contentContainerStyle={{paddingHorizontal: 24, paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </MainView>
    )
}

export default VoiceScreen