"use client"

import { TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Dashboard: undefined;
  Meals: undefined;
  History: undefined;
  Insulin: undefined;
  Profile: undefined;
  Login: undefined;
  Signup: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function BackButton() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  // Hide the button on the dashboard
  if (route.name === 'Dashboard') return null;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard');
    }
  };

  return (
    <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
      <Ionicons name="arrow-back" size={24} color="black" />
    </TouchableOpacity>
  );
}

