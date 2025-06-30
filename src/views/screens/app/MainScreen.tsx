import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useContext, useState } from 'react'
import { openSettings } from 'react-native-permissions'
import HomeScreen from './HomeScreen';
import TabBar from '../../components/tabBar/TabBar';
import VideoScreen from './VideoScreen';
import SettingsNavigation from './settings/SettingsNavigation';
import ChatNavigation from './chat/ChatNavigation';
import { AlertBtnProps } from '../../../interfaces/ui.interface';
import CustomAlert from '../../components/ui/CustomAlert';
import { GlobalContext } from '../../../store/GlobalState';
import { selectEntitlementsAlert } from '../../../store/selectors/elber.selector';
import { setEntitlementsAlert } from '../../../store/actions/elber.actions';

export type MainScreenTapProps = {
    Home: undefined
    Video: undefined
    Chat: undefined
    Settings: undefined
}

const Tab = createBottomTabNavigator<MainScreenTapProps>();

const MainScreen = () => {
    const [showTabBar, setShowTabBar] = useState(true)
    
    const {state, dispatch} = useContext(GlobalContext)
    const entitlementsAlert = selectEntitlementsAlert(state.elber)
    const {isVisible, text, title} = entitlementsAlert

    const alertBtns: AlertBtnProps[] = [
        {
            label: 'Ok',
            type: 'default',
            action: () => {
                openSettings('application')
                dispatch(setEntitlementsAlert({isVisible: false, text: '', title: ''}))
            }
        },
        {
            label: 'Cancelar',
            type: 'cancel',
            action: () => {
                dispatch(setEntitlementsAlert({isVisible: false, text: '', title: ''}))
            }
        }
    ]

    return (
        <>
            <Tab.Navigator 
                screenOptions={{headerShown: false,}} 
                tabBar={(props) => <TabBar {...props} showTabBar={showTabBar} />}
            >
                <Tab.Screen name='Home' component={HomeScreen} />
                <Tab.Screen name='Video' component={VideoScreen} />
                <Tab.Screen name='Chat'>
                    {(props) => <ChatNavigation {...props} setShowTabBar={setShowTabBar} />}
                </Tab.Screen>
                <Tab.Screen name='Settings' component={SettingsNavigation} />
            </Tab.Navigator>
            <CustomAlert 
                visible={isVisible}
                title={title}
                message={text}
                alertBtns={alertBtns}
            />
        </>
    )
}

export default MainScreen
