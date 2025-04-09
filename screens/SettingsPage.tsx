import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight, Bell, Shield, Smartphone, HelpCircle } from 'lucide-react-native';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [bloodSugarUnit, setBloodSugarUnit] = useState('mg/dL');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferencias</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Bell size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Notificaciones</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#d1d5db', true: '#22c55e' }}
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

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Shield size={20} color="#6b7280" />
                  <Text style={styles.settingText}>Modo Oscuro</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#d1d5db', true: '#22c55e' }}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rangos Objetivo</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Rango de Glucosa</Text>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>80 - 140 mg/dL</Text>
                  <ChevronRight size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingText}>Recordatorios</Text>
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
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
});