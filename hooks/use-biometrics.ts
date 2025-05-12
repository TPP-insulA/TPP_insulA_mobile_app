// BIOMETRICS TEMPORARILY DISABLED
/*
import { useEffect, useState, useRef } from 'react';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  saveCredentialsForBiometrics,
  removeCredentialsForBiometrics, 
  getCredentialsForBiometrics
} from '../lib/secure-storage';
*/

import { useState } from 'react';

type BiometricType = 'TouchID' | 'FaceID' | 'Biometrics' | null;

interface UseBiometricsReturn {
  isBiometricsAvailable: boolean;
  biometricType: BiometricType;
  isBiometricsEnabled: boolean;
  isEnrollingBiometrics: boolean;
  enableBiometrics: (email: string, password: string) => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  authenticateWithBiometrics: (promptMessage: string) => Promise<{ success: boolean, credentials?: { email: string, password: string } }>;
  showBiometricPrompt: (promptMessage: string) => Promise<boolean>;
  saveBiometricsChoice: (shouldEnable: boolean, email?: string, password?: string) => Promise<void>;
  hasUserBeenAskedForBiometrics: () => Promise<boolean>;
}

export const useBiometrics = (): UseBiometricsReturn => {
  // Return mock values while biometrics are disabled
  return {
    isBiometricsAvailable: false,
    biometricType: null,
    isBiometricsEnabled: false,
    isEnrollingBiometrics: false,
    enableBiometrics: async () => false,
    disableBiometrics: async () => {},
    authenticateWithBiometrics: async () => ({ success: false }),
    showBiometricPrompt: async () => false,
    saveBiometricsChoice: async () => {},
    hasUserBeenAskedForBiometrics: async () => true
  };
};

