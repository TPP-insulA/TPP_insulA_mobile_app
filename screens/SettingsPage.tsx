import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { ChevronRight, Bell, Shield, Smartphone, HelpCircle, Settings, Fingerprint } from 'lucide-react-native';
import { BackButton } from '../components/back-button';
import { useNavigation } from '@react-navigation/native';
import { useBiometrics } from '../hooks/use-biometrics';

export default function SettingsPage() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [bloodSugarUnit, setBloodSugarUnit] = useState('mg/dL');
  
  const { 
    isBiometricsAvailable, 
    biometricType, 
    isBiometricsEnabled,
    enableBiometrics,
    disableBiometrics
  } = useBiometrics();
  
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  
  useEffect(() => {
    setBiometricsEnabled(isBiometricsEnabled);
  }, [isBiometricsEnabled]);
  const handleBiometricsToggle = async (value: boolean) => {
    try {
      if (value) {
        // For enabling biometrics in settings, we'll show an alert and redirect to login
        Alert.alert(
          "Activar Biometría",
          "Para activar la autenticación biométrica, necesitas cerrar sesión y volver a iniciar sesión.",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Cerrar Sesión",
              onPress: async () => {
                try {
                  await disableBiometrics(); // Make sure it's disabled first
                  // Navigate to login screen
                  navigation.navigate('Login' as never);
                } catch (error) {
                  console.error('Error during logout:', error);
                }
              }
            }
          ]
        );
      } else {
        await disableBiometrics();
        setBiometricsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling biometrics:', error);
      Alert.alert(
        "Error",
        "Ocurrió un error al cambiar la configuración biométrica."
      );
    }
  };
  
  const getBiometricName = () => {
    switch (biometricType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      default:
        return 'Biometría';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackButton />
            </TouchableOpacity>
            <Settings width={32} height={32} color="#4CAF50" />
            <Text style={styles.title}>Configuración</Text>
          </View>
        </View>

        <View style={styles.content}>          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferencias</Text>
            <View style={styles.card}>
              {isBiometricsAvailable && (
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Fingerprint size={20} color="#6b7280" />
                    <Text style={styles.settingText}>
                      Inicio de sesión con {getBiometricName()}
                    </Text>
                  </View>
                  <Switch
                    value={biometricsEnabled}
                    onValueChange={handleBiometricsToggle}
                    trackColor={{ false: '#d1d5db', true: '#4CAF50' }}
                  />
                </View>
              )}
            
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Bell size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Notificaciones</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#d1d5db', true: '#4CAF50' }}
                />
              </View>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Smartphone size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Unidad de Glucosa</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{bloodSugarUnit}</Text>
                  <ChevronRight size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rangos Objetivo</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingText}>Rango de Glucosa</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>80 - 140 mg/dL</Text>
                  <ChevronRight size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingText}>Recordatorios</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>2 activos</Text>
                  <ChevronRight size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayuda</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <HelpCircle size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Centro de Ayuda</Text>
                </View>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Shield size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Política de Privacidad</Text>
                </View>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Shield size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Términos de Servicio</Text>
                </View>
                <ChevronRight size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.version}>
            <Text style={styles.versionText}>Versión 1.0.0</Text>
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
  header: {
    width: '100%',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingText: {
    fontSize: 16,
    color: '#111827',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  version: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    alignSelf: 'center',
  },
});