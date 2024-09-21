import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react'
import HomeScreen from './HomeScreen';
import SettingsScreen from './SettingsScreen';
import TabBar from '../../components/tabBar/TabBar';
import ChatScreen from './ChatScreen';
import VideoScreen from './VideoScreen';

type MainScreenTapProps = {
    Home: undefined
    Video: undefined
    Chat: undefined
    Settings: undefined
}

const Tab = createBottomTabNavigator<MainScreenTapProps>();

const MainScreen = () => {
    return (
        <Tab.Navigator screenOptions={{headerShown: false}} tabBar={(props) => <TabBar {...props} />}>
            <Tab.Screen name='Home' component={HomeScreen} />
            <Tab.Screen name='Video' component={VideoScreen} />
            <Tab.Screen name='Chat' component={ChatScreen} />
            <Tab.Screen name='Settings' component={SettingsScreen} />
        </Tab.Navigator>
    )
}

export default MainScreen
