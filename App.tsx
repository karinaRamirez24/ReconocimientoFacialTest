import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReferenceScreen from './screens/ReferenceScreen';
import VerifyScreen from './screens/VerifyScreen';
import SuccessScreen from './screens/SuccessScreen';
import { enableScreens } from 'react-native-screens';
import CameraDebugScreen from './screens/CameraDebugScreen';
enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Facial Recognition">
        <Stack.Screen name="Reference1" component={CameraDebugScreen} />
        <Stack.Screen name="Facial Recognition" component={ReferenceScreen} />
        <Stack.Screen name="Verify" component={VerifyScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
