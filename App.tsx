import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, navigationTheme } from './components/theme-provider';
import { useAuth } from './hooks/use-auth';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import MealsPage from './screens/MealsPage';
import HistoryPage from './screens/HistoryPage';
import InsulinPage from './screens/InsulinPage';
import ProfilePage from './screens/ProfilePage';
import ForgotPasswordPage from './screens/ForgotPasswordPage';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsPage from './screens/SettingsPage';
import { BackButton } from './components/back-button';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPasswordPage" component={ForgotPasswordPage} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: () => <BackButton />,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Meals"
        component={MealsPage}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="History"
        component={HistoryPage}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Insulin"
        component={InsulinPage}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsPage}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, initialize } = useAuth();

  // Initialize auth state when app loads
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <ThemeProvider>
          {isLoading ? (
            <LoadingScreen />
          ) : (
            isAuthenticated ? <AppStack /> : <AuthStack />
          )}
        </ThemeProvider>
      </NavigationContainer>
      <RNStatusBar barStyle="light-content" backgroundColor="#256029" />
    </SafeAreaProvider>
  );
}