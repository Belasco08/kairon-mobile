import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
// 👇 IMPORT NOVO PARA A ÁREA SEGURA
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Home } from '../screens/dashboard/Home';
import { AppointmentList } from '../screens/schedule/AppointmentList';
import { FinanceDashboard } from '../screens/finance/Dashboard';
import { CompanySettings } from '../screens/settings/CompanySettings';

// ==============================================================================
// 🎨 TEMA KAIRON PREMIUM
// ==============================================================================
const theme = {
  primary: '#0F172A',      
  cardBg: '#1E293B',       
  gold: '#D4AF37',         
  textInactive: '#64748B',
  border: 'rgba(255, 255, 255, 0.05)',
};

type BottomTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Finance: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabs() {
  // 👇 PEGA O TAMANHO DOS BOTÕES DO SISTEMA (ANDROID/IOS)
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.textInactive,
        
        tabBarLabelStyle: { 
            fontSize: 10,
            fontWeight: '600',
            paddingBottom: Platform.OS === 'ios' ? 0 : 8,
        },
        
        tabBarStyle: { 
            backgroundColor: theme.primary,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            
            // 👇 A MÁGICA ACONTECE AQUI: Soma a altura base (70) com o tamanho do menu do celular
            height: 70 + insets.bottom, 
            paddingTop: 10,
            // 👇 Dá o espaço exato embaixo para os botões do Android não cobrirem o texto
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10,
            
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Feather.glyphMap = 'circle';

          switch (route.name) {
            case 'Dashboard': iconName = 'grid'; break;
            case 'Schedule': iconName = 'calendar'; break;
            case 'Finance': iconName = 'dollar-sign'; break;
            case 'Settings': iconName = 'menu'; break;
          }

          return (
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: focused ? 1.15 : 1 }]
            }}>
                <Feather name={iconName} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Home} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Schedule" component={AppointmentList} options={{ tabBarLabel: 'Agenda' }} />
      <Tab.Screen name="Finance" component={FinanceDashboard} options={{ tabBarLabel: 'Caixa' }} />
      <Tab.Screen name="Settings" component={CompanySettings} options={{ tabBarLabel: 'Menu' }} />
    </Tab.Navigator>
  );
}