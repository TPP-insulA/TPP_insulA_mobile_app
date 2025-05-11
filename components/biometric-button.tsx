import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Fingerprint, ScanFace } from 'lucide-react-native';

interface BiometricButtonProps {
  biometricType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
  onPress: () => void;
}

export const BiometricButton: React.FC<BiometricButtonProps> = ({ biometricType, onPress }) => {
  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'TouchID':
        return <Fingerprint size={22} color="#FFFFFF" />;
      case 'FaceID':
        return <ScanFace size={22} color="#FFFFFF" />;
      default:
        return <Fingerprint size={22} color="#FFFFFF" />;
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
    <TouchableOpacity style={styles.biometricButton} onPress={onPress}>
      <View style={styles.biometricContent}>
        {getBiometricIcon()}
        <Text style={styles.biometricText}>Iniciar sesión con {getBiometricName()}</Text>
      </View>
    </TouchableOpacity>
  );
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
