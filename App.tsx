import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme';
import { SessionProvider } from './src/context/SessionContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import DiscountDetailScreen from './src/screens/DiscountDetailScreen';

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
  DiscountDetail: { items: string; type: string; custType: string; schemeName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─────────────────────────────────────────
//  Global Root Layout (Fixes Transparent Nav)
// ─────────────────────────────────────────
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingBottom: insets.bottom }}>
      {children}
    </View>
  );
};

// ─────────────────────────────────────────
//  Root App
// ─────────────────────────────────────────
function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <RootLayout>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  contentStyle: { backgroundColor: '#F8F9FD' }
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
                <Stack.Screen name="DiscountDetail" component={DiscountDetailScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </RootLayout>
        </SafeAreaProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
