import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme';
import { SessionProvider } from './src/context/SessionContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ── Screens ──────────────────────────────────────────────────────────────────
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import OrderEntryScreen from './src/screens/OrderEntryScreen';
import DiscountScreen from './src/screens/DiscountScreen';
import PriceDetailsScreen from './src/screens/PriceDetailsScreen';
import ReportScreen from './src/screens/ReportScreen';
import InvoiceDetailScreen from './src/screens/InvoiceDetailScreen';
import MiniStatementScreen from './src/screens/MiniStatementScreen';
import BankDetailsScreen from './src/screens/BankDetailsScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';
import VehicleTrackingScreen from './src/screens/VehicleTrackingScreen';
import LoginResponseScreen from './src/screens/LoginResponseScreen';
import OrderEntryReportScreen from './src/screens/OrderEntryReportScreen';
import CreditDebitNoteScreen from './src/screens/CreditDebitNoteScreen';

// ─────────────────────────────────────────
//  Navigation types
// ─────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Registration: undefined;
  Dashboard: undefined;
  OrderEntry: undefined;
  Discount: undefined;
  PriceDetails: undefined;
  Report: undefined;
  InvoiceDetail: undefined;
  MiniStatement: undefined;
  BankDetails: undefined;
  ContactUs: undefined;
  VehicleTracking: undefined;
  LoginResponse: { data: any };
  OrderEntryReport: undefined;
  CreditDebitNote: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─────────────────────────────────────────
//  Root App
// ─────────────────────────────────────────
function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Registration" component={RegistrationScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="OrderEntry" component={OrderEntryScreen} />
              <Stack.Screen name="Discount" component={DiscountScreen} />
              <Stack.Screen name="PriceDetails" component={PriceDetailsScreen} />
              <Stack.Screen name="Report" component={ReportScreen} />
              <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
              <Stack.Screen name="MiniStatement" component={MiniStatementScreen} />
              <Stack.Screen name="BankDetails" component={BankDetailsScreen} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} />
              <Stack.Screen name="VehicleTracking" component={VehicleTrackingScreen} />
              <Stack.Screen name="LoginResponse" component={LoginResponseScreen} />
              <Stack.Screen name="OrderEntryReport" component={OrderEntryReportScreen} />
              <Stack.Screen name="CreditDebitNote" component={CreditDebitNoteScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
