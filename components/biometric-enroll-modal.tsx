// BIOMETRICS TEMPORARILY DISABLED
import React from 'react';
import { View } from 'react-native';

interface BiometricEnrollModalProps {
  visible: boolean;
  biometricType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
  onAccept: () => void;
  onReject: () => void;
}

export const BiometricEnrollModal: React.FC<BiometricEnrollModalProps> = () => {
  // Return null while biometrics are disabled
  return null;
};
