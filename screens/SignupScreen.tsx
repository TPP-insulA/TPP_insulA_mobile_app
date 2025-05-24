import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GlucoseProfile } from "../types";
import { useAuth } from "../hooks/use-auth";
import { useGoogleAuth } from "../hooks/use-google-auth";
import { useFirebaseAuth } from '../hooks/use-firebase-auth';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Signup: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    weight: "",
    height: "",
    glucoseProfile: "" as GlucoseProfile,
  });
  
  const { register, isLoading, error: authError, isAuthenticated } = useAuth();
  const { configureGoogleSignIn, signInWithGoogle } = useGoogleAuth();
  const { handleGoogleSignIn, handleEmailSignUp } = useFirebaseAuth();
  const [error, setError] = useState("");
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const navigation = useNavigation<SignupScreenNavigationProp>();

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Update error message if authError changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Handle navigation based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }
  }, [isAuthenticated, navigation]);

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError("Por favor completa todos los campos");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden");
          return false;
        }
        break;
      case 2:
        const { birthDay, birthMonth, birthYear } = formData;
        if (!formData.firstName || !formData.lastName || 
            !birthDay || !birthMonth || !birthYear || 
            !formData.weight || !formData.height) {
          setError("Por favor completa todos los campos");
          return false;
        }
        
        // Validar fecha
        const day = parseInt(birthDay);
        const month = parseInt(birthMonth);
        const year = parseInt(birthYear);
        const date = new Date(year, month - 1, day);
        
        if (date.getDate() !== day || 
            date.getMonth() !== month - 1 || 
            date.getFullYear() !== year ||
            date > new Date()) {
          setError("Fecha de nacimiento inválida");
          return false;
        }
        break;
      case 3:
        if (!formData.glucoseProfile) {
          setError("Por favor selecciona tu perfil glucémico");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setError("");
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleGoogleSignInPress = async () => {
    console.log('[SignupScreen] Starting Google Sign-In process...');
    try {
      const firebaseUser = await handleGoogleSignIn();
      console.log('[SignupScreen] Google Sign-In successful:', {
        email: firebaseUser?.email,
        uid: firebaseUser?.uid
      });

      // Pre-fill form with user data
      if (firebaseUser?.email) {
        setFormData(prev => ({
          ...prev,
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : '',
          lastName: firebaseUser.displayName ? firebaseUser.displayName.split(' ').slice(1).join(' ') : '',
        }));
        setIsGoogleSignIn(true);
        setStep(2);
        console.log('[SignupScreen] Form pre-filled and moved to step 2');
      }
    } catch (error: any) {
      console.error('[SignupScreen] Google Sign-In error:', error);
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

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    try {
      console.log('[SignupScreen] Starting registration process...');
      await handleEmailSignUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDay: parseInt(formData.birthDay),
        birthMonth: parseInt(formData.birthMonth),
        birthYear: parseInt(formData.birthYear),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        glucoseProfile: formData.glucoseProfile,
      });
      console.log('[SignupScreen] Registration successful');
    } catch (err: any) {
      console.error('[SignupScreen] Registration error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Email en uso',
          'Ya existe una cuenta con este email. ¿Deseas iniciar sesión?',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Iniciar sesión',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else if (err.code === 'auth/network-request-failed') {
        setError('Error de conexión. Por favor, verifica tu conexión a internet.');
      } else {
        setError(err.message || 'Error al registrarse');
      }
    }
  };

  const handleChange = (name: string, value: string) => {
    if ((name === 'birthDay' || name === 'birthMonth') && value.length > 2) {
      return;
    }
    if (name === 'birthYear' && value.length > 4) {
      return;
    }
    
    // Validar que solo se ingresen números
    if ((name === 'birthDay' || name === 'birthMonth' || name === 'birthYear') && !/^\d*$/.test(value)) {
      return;
    }

    // Validar rangos
    if (name === 'birthDay' && parseInt(value) > 31) {
      return;
    }
    if (name === 'birthMonth' && parseInt(value) > 12) {
      return;
    }
    if (name === 'birthYear') {
      const currentYear = new Date().getFullYear();
      if (value.length === 4 && (parseInt(value) > currentYear || parseInt(value) < 1900)) {
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
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
                value={formData.password}
                onChangeText={(value) => handleChange("password", value)}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange("confirmPassword", value)}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </>
        );

      case 2:
        return (
          <>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChangeText={(value) => handleChange("firstName", value)}
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChangeText={(value) => handleChange("lastName", value)}
                  editable={!isLoading}
                />
              </View>
            </View>

            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateInput}>
                <TextInput
                  style={[styles.input, styles.dateField]}
                  placeholder="DD"
                  value={formData.birthDay}
                  onChangeText={(value) => handleChange("birthDay", value)}
                  keyboardType="numeric"
                  maxLength={2}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.dateSeparator}>/</Text>
              <View style={styles.dateInput}>
                <TextInput
                  style={[styles.input, styles.dateField]}
                  placeholder="MM"
                  value={formData.birthMonth}
                  onChangeText={(value) => handleChange("birthMonth", value)}
                  keyboardType="numeric"
                  maxLength={2}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.dateSeparator}>/</Text>
              <View style={[styles.dateInput, styles.yearInput]}>
                <TextInput
                  style={[styles.input, styles.dateField]}
                  placeholder="AAAA"
                  value={formData.birthYear}
                  onChangeText={(value) => handleChange("birthYear", value)}
                  keyboardType="numeric"
                  maxLength={4}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  value={formData.weight}
                  onChangeText={(value) => handleChange("weight", value)}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="170"
                  value={formData.height}
                  onChangeText={(value) => handleChange("height", value)}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
            </View>
          </>
        );

      case 3:
        return (
          <View style={styles.profileContainer}>
            <Text style={styles.label}>Selecciona tu perfil glucémico:</Text>
            
            <TouchableOpacity
              style={[
                styles.profileButton,
                formData.glucoseProfile === 'hypo' && styles.profileButtonSelected
              ]}
              onPress={() => handleChange("glucoseProfile", "hypo")}
            >
              <Text style={[
                styles.profileButtonText,
                formData.glucoseProfile === 'hypo' && styles.profileButtonTextSelected
              ]}>Tendencia a Hipoglucemia</Text>
              <Text style={styles.glucoseValueText}>
                {'< 70 mg/dL'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profileButton,
                formData.glucoseProfile === 'normal' && styles.profileButtonSelected
              ]}
              onPress={() => handleChange("glucoseProfile", "normal")}
            >
              <Text style={[
                styles.profileButtonText,
                formData.glucoseProfile === 'normal' && styles.profileButtonTextSelected
              ]}>Nivel Normal</Text>
              <Text style={styles.glucoseValueText}>
                {'70 - 180 mg/dL'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profileButton,
                formData.glucoseProfile === 'hyper' && styles.profileButtonSelected
              ]}
              onPress={() => handleChange("glucoseProfile", "hyper")}
            >
              <Text style={[
                styles.profileButtonText,
                formData.glucoseProfile === 'hyper' && styles.profileButtonTextSelected
              ]}>Tendencia a Hiperglucemia</Text>
              <Text style={styles.glucoseValueText}>
                {'> 180 mg/dL'}
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/insula-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.description}>
              {step === 1 ? "Ingresa tus datos básicos" : 
               step === 2 ? "Información personal" : 
               "Información de salud"}
            </Text>
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    s === step && styles.stepDotActive,
                    s < step && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.cardContent}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {renderStepContent()}

              {step === 1 && (
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
              )}

              <View style={[styles.buttonContainer, step === 1 && styles.buttonContainerCenter]}>
                {step > 1 && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handlePrevStep}
                    disabled={isLoading}
                  >
                    <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                      Anterior
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    step === 1 ? styles.buttonFullWidth : styles.buttonWithPrev
                  ]}
                  onPress={step === 3 ? handleSubmit : handleNextStep}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading
                      ? "Procesando..." 
                      : step === 3 
                        ? "Crear Cuenta" 
                        : "Siguiente"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Ya tienes una cuenta?{" "}
              <Text 
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Iniciar sesión
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  content: {
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 32,
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  stepDotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  cardContent: {
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWithPrev: {
    flex: 1,
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
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonTextSecondary: {
    color: '#4CAF50',
  },
  buttonText: {
    color: 'white',
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
  profileContainer: {
    gap: 12,
  },
  profileButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  profileButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0fdf4',
  },
  profileButtonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  profileButtonTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  buttonContainerCenter: {
    justifyContent: 'center',
  },
  buttonFullWidth: {
    minWidth: 200,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  glucoseValueText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dateInput: {
    flex: 2,
  },
  yearInput: {
    flex: 3,
  },
  dateField: {
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 18,
    color: '#6b7280',
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

