import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { useAuth } from '../contexts/AuthContext'; 

// Tutoriais e Telas
import { OnboardingScreen } from '../screens/OnboardingScreen'; 
import { ServiceList } from '../screens/services/ServiceList';
import { CreateService } from '../screens/services/CreateService';
import { EditService } from '../screens/services/EditService';
import { ProfessionalList } from '../screens/professionals/ProfessionalList';
import { CreateProfessional } from '../screens/professionals/CreateProfessional';
import { EditProfessional } from '../screens/professionals/EditProfessional';
import { ClientList } from '../screens/clients/ClientList';
import { ClientDetails } from '../screens/clients/ClientDetails';
import { AppointmentDetails } from '../screens/schedule/AppointmentDetails';
import { CreateAppointment } from '../screens/schedule/CreateAppointment';
import { EditAppointment } from '../screens/schedule/EditAppointment';
import { CalendarView } from '../screens/schedule/CalendarView';
import { FinanceDashboard } from '../screens/finance/Dashboard';
import { Reports } from '../screens/finance/Reports';
import { FinancialRecords } from '../screens/finance/FinancialRecords';
import { CompanySettings } from '../screens/settings/CompanySettings';
import { ProfileSettings } from '../screens/settings/ProfileSettings';
import { NotificationSettings } from '../screens/settings/NotificationSettings';
import { WhatsAppSettings } from '../screens/settings/WhatsAppSettings';
import { CompanyPublic } from '../screens/public/CompanyPublic';
import { BookingScreen } from '../screens/public/BookingScreen';

// Produtos (Estoque)
import { ProductList } from '../screens/products/ProductList'; 
import { CreateProduct } from '../screens/products/CreateProduct';

// 👇 NOVAS IMPORTAÇÕES ADICIONADAS AQUI
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { GoalsInfoScreen } from '../screens/GoalsInfoScreen';
import { RenewalFeedbackScreen } from '../screens/RenewalFeedbackScreen';

const Stack = createNativeStackNavigator();

export function AppStack() {
  const { hasSeenTutorial } = useAuth() as any;

  // 👇 MÁGICA DE VERDADE: Se a variável ainda for undefined, significa que o AsyncStorage ainda está carregando.
  // Nós seguramos a renderização das rotas com uma tela vazia (ou loading) até termos certeza do valor.
  if (hasSeenTutorial === undefined || hasSeenTutorial === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      // Agora o React Navigation só vai ler isso quando tiver certeza se é true ou false
      initialRouteName={hasSeenTutorial ? "BottomTabs" : "OnboardingScreen"} 
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      
      {/* Service Screens */}
      <Stack.Screen name="ServiceList" component={ServiceList} />
      <Stack.Screen name="CreateService" component={CreateService} />
      <Stack.Screen name="EditService" component={EditService} />
      
      {/* Professional Screens */}
      <Stack.Screen name="ProfessionalList" component={ProfessionalList} />
      <Stack.Screen name="CreateProfessional" component={CreateProfessional} />
      <Stack.Screen name="EditProfessional" component={EditProfessional} />
      
      {/* Client Screens */}
      <Stack.Screen name="ClientList" component={ClientList} />
      <Stack.Screen name="ClientDetails" component={ClientDetails} />
      
      {/* Appointment Screens */}
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetails} />
      <Stack.Screen name="CreateAppointment" component={CreateAppointment} />
      <Stack.Screen name="EditAppointment" component={EditAppointment} />
      <Stack.Screen name="CalendarView" component={CalendarView} />
      
      {/* Finance Screens */}
      <Stack.Screen name="FinanceDashboard" component={FinanceDashboard} />
      <Stack.Screen name="Reports" component={Reports} />
      <Stack.Screen name="FinancialRecords" component={FinancialRecords} />
      
      {/* Settings Screens */}
      <Stack.Screen name="CompanySettings" component={CompanySettings} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettings} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
      <Stack.Screen name="WhatsAppSettings" component={WhatsAppSettings} />

      {/* Products Screens (Estoque) */}
      <Stack.Screen name="ProductList" component={ProductList} />
      <Stack.Screen name="CreateProduct" component={CreateProduct} />
      
      {/* Public Screens */}
      <Stack.Screen name="CompanyPublic" component={CompanyPublic} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} />

      {/* 👇 NOVA TELA: INFORMAÇÕES DE METAS 👇 */}
      <Stack.Screen name="GoalsInfoScreen" component={GoalsInfoScreen} />

      {/* TELA DE ASSINATURA (PLUS) COMO MODAL */}
      <Stack.Screen 
        name="SubscriptionScreen" 
        component={SubscriptionScreen} 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom' 
        }} 
      />

      {/* 👇 NOVA TELA: FEEDBACK DE RENOVAÇÃO COMO MODAL 👇 */}
      <Stack.Screen 
        name="RenewalFeedbackScreen" 
        component={RenewalFeedbackScreen} 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom' 
        }} 
      />
    </Stack.Navigator>
  );
}