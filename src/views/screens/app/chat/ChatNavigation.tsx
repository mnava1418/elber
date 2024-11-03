import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { globalColors } from '../../../../styles/mainStyles'
import ChatScreen from './ChatScreen'
import { useFocusEffect } from '@react-navigation/native'

export type ChatNavigationProps = {
    ChatScreen: undefined
}

type ChatProps = {
    setShowTabBar: React.Dispatch<React.SetStateAction<boolean>>
}

const Stack = createStackNavigator<ChatNavigationProps>()

const ChatNavigation = ({setShowTabBar}: ChatProps) => {
    useFocusEffect(
        React.useCallback(() => {
            setShowTabBar(false)        
            return () => {               
                setShowTabBar(true)
            };
        }, [])
    );

    return (
        <Stack.Navigator screenOptions={{headerShown: false, cardStyle: {backgroundColor: globalColors.background}}}>
            <Stack.Screen name='ChatScreen' component={ChatScreen} />
        </Stack.Navigator>
    )
}

export default ChatNavigation