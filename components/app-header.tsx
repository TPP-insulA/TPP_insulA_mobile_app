import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

interface AppHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function AppHeader({ title, icon, onBack, right }: AppHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.header, { backgroundColor: '#4CAF50' }]}> 
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <View style={styles.backIconBg}>
              <Feather name="arrow-left" size={30} color="#4CAF50" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.titleContainer}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : <View style={styles.rightPlaceholder} />}
      </View>
      <View style={styles.separator} />
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 64;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: HEADER_HEIGHT,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      android: {
        paddingTop: 0,
      },
      ios: {
        paddingTop: 0,
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconBg: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 0,
    textAlign: 'left',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 0,
  },
  icon: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlaceholder: {
    width: 40,
    height: 40,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
});
