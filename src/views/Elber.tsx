import { createStackNavigator } from '@react-navigation/stack';
import React, { useState } from 'react'
import AuthInitScreen from './screens/auth/AuthInitScreen';
import HomeScreen from './screens/app/HomeScreen';
import LoginScreen from './screens/auth/LoginScreen';

export type StackNavigationProps = {
    AuthInit: undefined,
    Home: undefined,
    Login: undefined
}

const Stack = createStackNavigator<StackNavigationProps>();

const Elber = () => {
    const [isSignedIn, setIsSignedIn] = useState(false)

    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            {isSignedIn ? (
                <Stack.Screen name='Home' component={HomeScreen} />
            ) : (
                <>
                    <Stack.Screen name='AuthInit' component={AuthInitScreen} />
                    <Stack.Screen name='Login' component={LoginScreen} />
                </>
            )}
        </Stack.Navigator>
    )
}

export default Elber