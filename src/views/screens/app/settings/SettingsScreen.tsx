import React, { useContext, useState } from 'react'
import CustomButton from '../../../components/ui/CustomButton'
import MainView from '../../../components/ui/MainView'
import { signOut } from '../../../../services/auth.service'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Subtitle from '../../../components/ui/Subtitle'
import SectionContainer from '../../../components/sections/SectionContainer'
import { settingsAccount } from '../../../../utils/appData.utils'
import CustomAlert from '../../../components/ui/CustomAlert'
import { AlertBtnProps } from '../../../../interfaces/ui.interface'
import { GlobalContext } from '../../../../store/GlobalState'

const SettingsScreen = () => {
    const {top} = useSafeAreaInsets()
    
    const {dispatch} = useContext(GlobalContext)
    const [modalVisible, setModalVisible] = useState(false);
    const alertBtns: AlertBtnProps[] = [
        {
            type: 'default',
            label: 'Continuar',
            action: () => {
                setModalVisible(false)
                signOut(dispatch)
            }
        },
        {
            type: 'cancel',
            label: 'Cancelar',
            action: () => {
                setModalVisible(false)
            }
        }
    ]

    return (
        <MainView>
            <CustomNavBar title='Settings'/>
            <ScrollView style={{marginTop: top + 72}}>
                <View>
                    <Subtitle style={{marginBottom: 16}}>Cuenta</Subtitle>
                    <SectionContainer sectionItems={settingsAccount} />
                </View>
                {
                    /*<View style={{marginTop: 40}}>
                        <Subtitle style={{marginBottom: 16}}>Elber</Subtitle>
                        <SectionContainer sectionItems={settingsElber} />
                    </View>*/
                }
            </ScrollView>
            <CustomButton style={{marginVertical: 24}} label='Sign Out' type='primary' onPress={() => {setModalVisible(true)}}/>
            <CustomAlert title='Sign Out' message='¿Estás seguro de cerrar sesión?' alertBtns={alertBtns} visible={modalVisible} />
        </MainView>
    )
}

export default SettingsScreen