import React, { useContext } from 'react'
import CustomButton from '../../../components/ui/CustomButton'
import MainView from '../../../components/ui/MainView'
import { signOut } from '../../../../services/auth.service'
import CustomNavBar from '../../../components/navBar/CustomNavBar'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CustomText from '../../../components/ui/CustomText'
import Subtitle from '../../../components/ui/Subtitle'
import { globalColors } from '../../../../styles/mainStyles'
import { GlobalContext } from '../../../../store/GlobalState'
import { selectAuthenticatedUser } from '../../../../store/selectors/auth.selector'
import Title from '../../../components/ui/Title'
import SectionContainer from '../../../components/sections/SectionContainer'
import { settingsSections } from '../../../../utils/appData.utils'

const SettingsScreen = () => {
    const {top} = useSafeAreaInsets()
    const {state} = useContext(GlobalContext)
    const user = selectAuthenticatedUser(state.auth)

    return (
        <MainView>
            <CustomNavBar title='Settings'/>
            <ScrollView style={{marginTop: top + 72}}>
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16}}>
                    <View style={{height: 72, width: 72, backgroundColor: globalColors.primary, borderRadius: 50, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                        <Title>{user.email.charAt(0).toUpperCase()}</Title>
                    </View>
                    <View style={{marginLeft: 16}}>
                        <Subtitle>{`Hola, ${user.name}`}</Subtitle>
                        <CustomText>{user.email}</CustomText>
                    </View>
                </View>
                <SectionContainer sectionItems={settingsSections} />
            </ScrollView>
            <CustomButton style={{marginVertical: 24}} label='Sign Out' type='primary' onPress={() => {signOut()}}/>
        </MainView>
    )
}

export default SettingsScreen