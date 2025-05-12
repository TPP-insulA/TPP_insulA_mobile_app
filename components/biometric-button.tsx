// BIOMETRICS TEMPORARILY DISABLED
import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

interface BiometricButtonProps {
  biometricType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
  onPress: () => void;
}

export const BiometricButton: React.FC<BiometricButtonProps> = () => {
  // Return null while biometrics are disabled
  return null;
};

const styles = StyleSheet.create({
  biometricButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  biometricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
