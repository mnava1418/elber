import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext } from 'react'
import AuthInitScreen from './screens/auth/AuthInitScreen';
import HomeScreen from './screens/app/HomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import { GlobalContext } from '../store/GlobalState';
import { selectIsAuthenticated } from '../store/selectors/auth.selector';

export type StackNavigationProps = {
    AuthInit: undefined,
    Home: undefined,
    Login: undefined
}

const Stack = createStackNavigator<StackNavigationProps>();

const Elber = () => {
    const {state} = useContext(GlobalContext)
    const isAuthenticated = selectIsAuthenticated(state.auth)
    
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            {isAuthenticated ? (
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