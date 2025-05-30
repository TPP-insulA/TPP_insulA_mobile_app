import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Dashboard: undefined;
  Meals: undefined;
  History: undefined;
  Insulin: undefined;
  Profile: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function Footer() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const isActive = (path: string) => route.name === path;

  const tabs = [
    { name: 'Dashboard', icon: 'home', label: 'Inicio' },
    { name: 'Meals', icon: 'coffee', label: 'Comidas' },
    { name: 'History', icon: 'calendar', label: 'Historial' },
    { name: 'Insulin', icon: 'activity', label: 'Insulina' },
    { name: 'Profile', icon: 'user', label: 'Perfil' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab, idx) => {
        const active = isActive(tab.name);
        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              active && styles.activeTab
            ]}
            onPress={() => navigation.navigate(tab.name as any)}
            activeOpacity={0.85}
          >
            <View style={styles.tabContent}>
              <Icon
                name={tab.icon}
                size={active ? 28 : 22}
                color={active ? '#43a047' : '#222'} // Verde más claro para icono activo
              />
              <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
              {active && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 5, // altura más baja
    backgroundColor: '#fff', // Fondo blanco
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 18, // Más elevación
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 }, // Sombra más marcada arriba
    shadowOpacity: 0.22, // Más opacidad
    shadowRadius: 12, // Más difusa
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, // menos padding
    borderRadius: 14,
    marginHorizontal: 2,
    minWidth: 60,
  },
  activeTab: {
    backgroundColor: 'rgba(67,160,71,0.13)', // Verde más claro para fondo activo
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    marginTop: 1,
    fontSize: 11,
    color: '#222', // Texto negro para tabs inactivas
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  activeLabel: {
    color: '#43a047', // Verde más claro para texto activo
    fontWeight: '700',
    fontSize: 12,
    textShadowColor: 'rgba(67,160,71,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2,
    borderRadius: 2,
    backgroundColor: '#43a047', // Indicador verde más claro
  },
});