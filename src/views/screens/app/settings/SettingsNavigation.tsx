import { createStackNavigator } from '@react-navigation/stack';
import React from 'react'
import { globalColors } from '../../../../styles/mainStyles';
import SettingsScreen from './SettingsScreen';

export type SettingsNavigationProps = {
    Settings: undefined
}

const Stack = createStackNavigator<SettingsNavigationProps>();

const SettingsNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false, cardStyle: {backgroundColor: globalColors.background}}}>
        <Stack.Screen name='Settings' component={SettingsScreen} />
    </Stack.Navigator>
  )
}

export default SettingsNavigation