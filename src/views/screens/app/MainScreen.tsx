import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react'
import HomeScreen from './HomeScreen';
import TabBar from '../../components/tabBar/TabBar';
import VideoScreen from './VideoScreen';
import SettingsNavigation from './settings/SettingsNavigation';
import ChatNavigation from './chat/ChatNavigation';

export type MainScreenTapProps = {
    Home: undefined
    Video: undefined
    Chat: undefined
    Settings: undefined
}

const Tab = createBottomTabNavigator<MainScreenTapProps>();

const MainScreen = () => {
    const [showTabBar, setShowTabBar] = useState(true)

    return (
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
    )
}

export default MainScreen
