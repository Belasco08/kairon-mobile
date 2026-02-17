import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CompanyPublic } from '../screens/public/CompanyPublic';
import { BookingScreen } from '../screens/public/BookingScreen';
import { BookingConfirmation } from '../screens/public/BookingConfirmation';

const Stack = createNativeStackNavigator();

export function PublicStack() {
  return (
    <Stack.Navigator
      initialRouteName="CompanyPublic"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="CompanyPublic" component={CompanyPublic} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmation} />
    </Stack.Navigator>
  );
}