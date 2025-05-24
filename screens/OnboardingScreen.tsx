// @ts-ignore: No types for react-native-onboarding-swiper
import Onboarding from 'react-native-onboarding-swiper';
import React, { useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PRIMARY_GREEN = '#4CAF50';
const BACKGROUND_WHITE = '#FFFFFF';
const ICON_SIZE = width * 0.4;

type RootStackParamList = {
  Dashboard: undefined;
  Onboarding: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OnboardingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const onboardingRef = useRef(null);

  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'false');
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleNext = () => {
    // @ts-ignore
    onboardingRef.current?.goNext();
  };

  const slides = [
    {
      backgroundColor: BACKGROUND_WHITE,
      image: (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="hand-wave" 
            size={ICON_SIZE} 
            color={PRIMARY_GREEN} 
          />
        </View>
      ),
      title: '¡Bienvenido a insulA!',
      subtitle: 'Tu compañero de todos los días para manejar la diabetes',
    },
    {
      backgroundColor: BACKGROUND_WHITE,
      image: (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="chart-line-variant" 
            size={ICON_SIZE} 
            color={PRIMARY_GREEN} 
          />
        </View>
      ),
      title: 'Todo lo que necesitás',
      subtitle: 'Calculadora de insulina, seguimiento de comidas y predicción de glucemia en segundos',
    },
    {
      backgroundColor: BACKGROUND_WHITE,
      image: (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="calculator-variant" 
            size={ICON_SIZE} 
            color={PRIMARY_GREEN} 
          />
        </View>
      ),
      title: 'Calculadora inteligente',
      subtitle: 'Te ayuda a calcular la insulina que necesitás según tu glucemia y las comidas',
    },
  ];

  return (
    <View style={styles.container}>
      <Onboarding
        ref={onboardingRef}
        pages={slides}
        onDone={handleDone}
        onSkip={handleDone}
        showSkip={true}
        showNext={true}
        showDone={true}
        bottomBarHighlight={false}
        bottomBarColor={BACKGROUND_WHITE}
        titleStyles={styles.title}
        subTitleStyles={styles.subtitle}
        containerStyles={styles.onboardingContainer}
        imageContainerStyles={styles.imageContainer}
        SkipButtonComponent={() => (
          <TouchableOpacity onPress={handleDone} style={styles.button}>
            <Text style={[styles.buttonText, { color: PRIMARY_GREEN }]}>Saltear</Text>
          </TouchableOpacity>
        )}
        NextButtonComponent={() => (
          <TouchableOpacity onPress={handleNext} style={styles.button}>
            <Text style={[styles.buttonText, { color: PRIMARY_GREEN }]}>Seguir</Text>
          </TouchableOpacity>
        )}
        DoneButtonComponent={() => (
          <TouchableOpacity onPress={handleDone} style={styles.button}>
            <Text style={[styles.buttonText, { color: PRIMARY_GREEN }]}>¡Vamos!</Text>
          </TouchableOpacity>
        )}
        dotStyle={{ backgroundColor: '#E0E0E0' }}
        activeDotStyle={{ backgroundColor: PRIMARY_GREEN }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_WHITE,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_WHITE,
  },
  imageContainer: {
    paddingBottom: 20,
  },
  iconContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
    color: PRIMARY_GREEN,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    color: '#333',
    lineHeight: 28,
  },
  button: {
    padding: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
