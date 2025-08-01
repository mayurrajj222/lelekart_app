import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmailScreen from './EmailScreen';
import OtpScreen from './OtpScreen';
import RegisterScreen from './RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2874f0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Email" 
        component={EmailScreen}
        options={{ title: 'Login' }}
      />
      <Stack.Screen 
        name="Otp" 
        component={OtpScreen}
        options={{ title: 'Verify OTP' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Complete Registration' }}
      />
    </Stack.Navigator>
  );
} 