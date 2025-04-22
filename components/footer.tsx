import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Calculator } from 'lucide-react-native';
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Dashboard')}>
        <View style={styles.tabContent}>
          <Icon name="home" size={20} color={isActive('Dashboard') ? '#4CAF50' : '#666'} />
          <Text style={[styles.label, isActive('Dashboard') && styles.activeLabel]}>Inicio</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Meals')}>
        <View style={styles.tabContent}>
          <Icon name="coffee" size={20} color={isActive('Meals') ? '#4CAF50' : '#666'} />
          <Text style={[styles.label, isActive('Meals') && styles.activeLabel]}>Comidas</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('History')}>
        <View style={styles.tabContent}>
          <Icon name="calendar" size={20} color={isActive('History') ? '#4CAF50' : '#666'} />
          <Text style={[styles.label, isActive('History') && styles.activeLabel]}>Historial</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Insulin')}>
        <View style={styles.tabContent}>
          <Calculator size={20} color={isActive('Insulin') ? '#4CAF50' : '#666'} />
          <Text style={[styles.label, isActive('Insulin') && styles.activeLabel]}>Insulina</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Profile')}>
        <View style={styles.tabContent}>
          <Icon name="user" size={20} color={isActive('Profile') ? '#4CAF50' : '#666'} />
          <Text style={[styles.label, isActive('Profile') && styles.activeLabel]}>Perfil</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    fontSize: 11,
    color: '#666',
  },
  activeLabel: {
    color: '#4CAF50',
  },
});