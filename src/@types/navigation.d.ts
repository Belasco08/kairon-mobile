import { NavigatorScreenParams } from '@react-navigation/native';

/* =======================
   AUTH STACK
======================= */
export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

/* =======================
   BOTTOM TABS
======================= */
export type BottomTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Services: undefined;
  Professionals: undefined;
  Clients: undefined;
  Finance: undefined;
  Settings: undefined;
};

/* =======================
   MAIN APP STACK
======================= */
export type AppStackParamList = {
  BottomTabs: NavigatorScreenParams<BottomTabParamList>;

  ServiceList: undefined;
  CreateService: undefined;
  EditService: { serviceId: string };

  ProfessionalList: undefined;
  CreateProfessional: undefined;
  EditProfessional: { professionalId: string };

  ClientList: undefined;
  ClientDetails: { clientId: string };

  AppointmentDetails: { appointmentId: string };

  CreateAppointment:
    | undefined
    | {
        clientId?: string;
        serviceId?: string;
        professionalId?: string;
      };

  EditAppointment: { appointmentId: string };

  CalendarView: undefined;
  FinanceDashboard: undefined;
  Reports: undefined;
  FinancialRecords: undefined;

  CompanySettings: undefined;
  ProfileSettings: undefined;
  NotificationSettings: undefined
  
  WhatsAppSettings: undefined;

  CompanyPublic: { companyId: string };
  BookingScreen: { companyId: string; serviceId?: string };
};

/* =======================
   ROOT STACK
======================= */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
  Loading: undefined;
};

/* =======================
   REACT NAVIGATION GLOBAL
======================= */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

/* =======================
   NAVIGATION TYPES
======================= */
export type AppNavigation =
  import('@react-navigation/native').NavigationProp<AppStackParamList>;

export type BottomTabNavigation =
  import('@react-navigation/native').NavigationProp<BottomTabParamList>;
