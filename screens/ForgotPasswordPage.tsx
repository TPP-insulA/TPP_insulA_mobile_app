import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Simulación de una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulamos un envío exitoso
      console.log("Email de recuperación enviado a:", email);
      setSuccess(true);
    } catch (error) {
      setError("No pudimos procesar tu solicitud. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.description}>
              Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
            </Text>
          </View>

          <View style={styles.cardContent}>
            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successMessage}>
                  <Text style={styles.successText}>
                    Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña.
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Volver al inicio de sesión</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

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

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Enviando..." : "Enviar instrucciones"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Recordaste tu contraseña?{" "}
              <Text 
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Iniciar sesión
              </Text>
            </Text>
          </View>
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
  },
  logo: {
    width: 120,
    height: 120,
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
  successContainer: {
    alignItems: 'center',
  },
  successMessage: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    color: '#15803d',
    textAlign: 'center',
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
  linkButton: {
    padding: 8,
  },
  linkText: {
    color: '#4CAF50',
    textAlign: 'center',
  },
});