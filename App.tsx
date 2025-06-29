import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, navigationTheme } from './components/theme-provider';
import { useAuth } from './hooks/use-auth';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true); //Comentar o descomentar dependiendo el caso

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
import PredictionResultPage from './screens/PredictionResultPage';
import { FullChatScreen } from './screens/FullChatScreen';
import { BackButton } from './components/back-button';
import OnboardingScreen from './screens/OnboardingScreen';

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
      <Stack.Screen name="PredictionResultPage" component={PredictionResultPage} options={{ headerShown: false }} />
      <Stack.Screen name="FullChat" component={FullChatScreen} options={{ headerShown: false }} />
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
  const [fontsLoaded] = useFonts({
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
  });
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Initialize auth state and check onboarding status when app loads
  useEffect(() => {
    const initializeApp = async () => {
      await initialize();
      const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(onboardingStatus === 'true');
    };
    initializeApp();
  }, [initialize]);

  if (!fontsLoaded || isLoading || hasSeenOnboarding === null) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <ThemeProvider>
            {isAuthenticated ? (
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!hasSeenOnboarding ? (
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : null}
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Meals" component={MealsPage} />
                <Stack.Screen name="History" component={HistoryPage} />
                <Stack.Screen name="Insulin" component={InsulinPage} />
                <Stack.Screen name="Profile" component={ProfilePage} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsPage} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="PredictionResultPage" component={PredictionResultPage} />
                <Stack.Screen name="FullChat" component={FullChatScreen} />
              </Stack.Navigator>
            ) : (
              <AuthStack />
            )}
          </ThemeProvider>
        </NavigationContainer>
        <RNStatusBar barStyle="light-content" backgroundColor="#2e7d32" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}