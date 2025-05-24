import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../hooks/use-auth";
import { useBiometrics } from "../hooks/use-biometrics";
import { useGoogleAuth } from "../hooks/use-google-auth";
import { BiometricEnrollModal } from "../components/biometric-enroll-modal";
import { Fingerprint } from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirebaseAuth } from '../hooks/use-firebase-auth';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  ForgotPasswordPage: undefined;
  Signup: undefined;
  Onboarding: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const { login, isLoading, error: authError, isAuthenticated } = useAuth();
  const { configureGoogleSignIn, signInWithGoogle } = useGoogleAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  const { 
    isBiometricsAvailable, 
    biometricType, 
    isBiometricsEnabled, 
    authenticateWithBiometrics, 
    saveBiometricsChoice,
    hasUserBeenAskedForBiometrics
  } = useBiometrics();
  const { handleGoogleSignIn, handleEmailSignIn } = useFirebaseAuth();

  // Check if biometrics can be used on component mount
  useEffect(() => {
    const checkBiometrics = async () => {
      // If biometrics is enabled, show the biometric auth prompt
      if (isBiometricsAvailable && isBiometricsEnabled) {
        handleBiometricAuth();
      }
    };

    checkBiometrics();
  }, [isBiometricsAvailable, isBiometricsEnabled]);
  
  // Check if we should show the biometrics enrollment modal after successful login
  useEffect(() => {
    const checkBiometricsEnrollment = async () => {
      if (
        isAuthenticated && // Authentication was successful
        isBiometricsAvailable && // Device has biometrics
        !isBiometricsEnabled && // Biometrics not already enabled
        !(await hasUserBeenAskedForBiometrics()) // User hasn't been asked before
      ) {
        setShowBiometricsModal(true);
      }
    };

    checkBiometricsEnrollment();
  }, [isAuthenticated]);

  // Update error message if authError changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Handle navigation based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      const checkBiometricsPrompt = async () => {
        const hasBeenAskedBefore = await hasUserBeenAskedForBiometrics();
        if (!hasBeenAskedBefore && isBiometricsAvailable && !isBiometricsEnabled) {
          setShowBiometricsModal(true);
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        }
      };
      checkBiometricsPrompt();
    }
  }, [isAuthenticated, isBiometricsAvailable, isBiometricsEnabled, navigation]);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Por favor ingresa email y contraseña");
      return;
    }

    try {
      await handleEmailSignIn(email, password);
    } catch (err: any) {
      console.error('[LoginScreen] Login error:', err);
      
      // Handle specific error cases
      if (err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos');
      } else if (err.code === 'auth/user-not-found') {
        Alert.alert(
          'Usuario no encontrado',
          'No existe una cuenta con este email. ¿Deseas registrarte?',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Registrarme',
              onPress: () => navigation.navigate('Signup')
            }
          ]
        );
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de conexión. Por favor, verifica tu conexión a internet.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    }
  };
  const handleBiometricAuth = async () => {
    try {
      const result = await authenticateWithBiometrics("Iniciar sesión en Insula");
      
      if (result.success && result.credentials) {
        // If successfully authenticated with biometrics, log in with stored credentials
        await login(result.credentials.email, result.credentials.password);
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
    }
  };
  const handleBiometricsAccept = async () => {
    // Save email and password for biometric login
    await saveBiometricsChoice(true, email, password);
    setShowBiometricsModal(false);
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const handleBiometricsReject = async () => {
    await saveBiometricsChoice(false);
    setShowBiometricsModal(false);
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const handleDemoLogin = () => {
    setEmail("fran@gmail.com");
    setPassword("Franfran");
  };

  const handleGoogleSignInPress = async () => {
    console.log('[LoginScreen] Starting Google Sign-In process...');
    try {
      const firebaseUser = await handleGoogleSignIn();
      console.log('[LoginScreen] Google Sign-In successful:', {
        email: firebaseUser?.email,
        uid: firebaseUser?.uid
      });
    } catch (error: any) {
      console.error('[LoginScreen] Google Sign-In error:', error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User cancelled the sign-in, no need to show error
        return;
      } else if (error.code === 'auth/network-request-failed') {
        setError('Error de conexión. Por favor, verifica tu conexión a internet.');
      } else {
        setError(error.message || 'Error al iniciar sesión con Google');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BiometricEnrollModal
        visible={showBiometricsModal}
        biometricType={biometricType}
        onAccept={handleBiometricsAccept}
        onReject={handleBiometricsReject}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/insula-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.description}>
              Ingresa tus credenciales para continuar
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPasswordPage')}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Ingresando..." : "Iniciar Sesión"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.googleButton]}
              onPress={handleGoogleSignInPress}
              disabled={isLoading}
            >
              <Image
                source={require('../assets/google-icon.png')}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                Continuar con Google
              </Text>
            </TouchableOpacity>

            {isBiometricsAvailable && !isBiometricsEnabled && (
              <TouchableOpacity
                style={[styles.biometricButton]}
                onPress={handleBiometricAuth}
                disabled={isLoading}
              >
                <Fingerprint size={18} color="#4CAF50" />
                <Text style={styles.biometricButtonText}>
                  Usar {biometricType === 'FaceID' ? 'Face ID' : biometricType === 'TouchID' ? 'Touch ID' : 'Biometría'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.demoButton]}
              onPress={handleDemoLogin}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>
                Usar credenciales de demo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes una cuenta?{" "}
            <Text 
              style={styles.footerLink}
              onPress={() => navigation.navigate('Signup')}
            >
              Regístrate
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: -10,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  cardContent: {
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  biometricButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  biometricButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  demoButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  demoButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
});
