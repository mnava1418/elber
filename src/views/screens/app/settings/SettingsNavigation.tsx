import { createStackNavigator } from '@react-navigation/stack';
import React from 'react'
import { globalColors } from '../../../../styles/mainStyles';
import SettingsScreen from './SettingsScreen';
import AccountScreen from './AccountScreen';
import PrivacyScreen from './PrivacyScreen';

export type SettingsNavigationProps = {
    SettingsInit: undefined,
    SettingsAccount: undefined,
    SettingsPrivacy: undefined,
    SettingsVoice: undefined
}

const Stack = createStackNavigator<SettingsNavigationProps>();

const SettingsNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false, cardStyle: {backgroundColor: globalColors.background}}}>
        <Stack.Screen name='SettingsInit' component={SettingsScreen} />
        <Stack.Screen name='SettingsAccount' component={AccountScreen} />
        <Stack.Screen name='SettingsPrivacy' component={PrivacyScreen} />        
    </Stack.Navigator>
  )
}

export default SettingsNavigation