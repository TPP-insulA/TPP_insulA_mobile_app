import { useEffect, useState, useRef } from 'react';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  saveCredentialsForBiometrics,
  removeCredentialsForBiometrics, 
  getCredentialsForBiometrics
} from '../lib/secure-storage';

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
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(false);
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState<boolean>(false);
  const rnBiometricsRef = useRef<ReactNativeBiometrics | null>(null);

  useEffect(() => {
    let mounted = true;

    const initBiometrics = async () => {
      try {
        // Initialize biometrics instance
        const biometricsInstance = new ReactNativeBiometrics({
          allowDeviceCredentials: true
        });
        
        if (!mounted) return;
        
        rnBiometricsRef.current = biometricsInstance;

        // Check if biometrics is available on the device
        const { available, biometryType } = await biometricsInstance.isSensorAvailable();
        
        if (!mounted) return;

        setIsBiometricsAvailable(available);
        
        if (available) {
          switch (biometryType) {
            case BiometryTypes.TouchID:
              setBiometricType('TouchID');
              break;
            case BiometryTypes.FaceID:
              setBiometricType('FaceID');
              break;
            case BiometryTypes.Biometrics:
              setBiometricType('Biometrics');
              break;
            default:
              setBiometricType(null);
          }
        }

        // Check if user has enabled biometrics for this app
        const isEnabled = await AsyncStorage.getItem('biometricsEnabled');
        if (!mounted) return;
        setIsBiometricsEnabled(isEnabled === 'true');
      } catch (error) {
        console.error('Error initializing biometrics:', error);
        if (!mounted) return;
        setIsBiometricsAvailable(false);
        setBiometricType(null);
        rnBiometricsRef.current = null;
      }
    };

    initBiometrics();

    return () => {
      mounted = false;
    };
  }, []);

  const enableBiometrics = async (email: string, password: string): Promise<boolean> => {
    const rnBiometrics = rnBiometricsRef.current;
    if (!rnBiometrics) {
      console.error('Biometrics not initialized');
      return false;
    }

    try {
      setIsEnrollingBiometrics(true);
      
      // Create a new key pair for biometric authentication
      const { publicKey } = await rnBiometrics.createKeys();
      
      if (publicKey) {
        // Store biometrics enabled flag
        await AsyncStorage.setItem('biometricsEnabled', 'true');
        
        // Save credentials for biometric login
        await saveCredentialsForBiometrics(email, password);
        
        setIsBiometricsEnabled(true);
        setIsEnrollingBiometrics(false);
        return true;
      }
      
      setIsEnrollingBiometrics(false);
      return false;
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      setIsEnrollingBiometrics(false);
      return false;
    }
  };

  const disableBiometrics = async (): Promise<void> => {
    const rnBiometrics = rnBiometricsRef.current;
    if (!rnBiometrics) {
      console.error('Biometrics not initialized');
      return;
    }

    try {
      await rnBiometrics.deleteKeys();
      await AsyncStorage.removeItem('biometricsEnabled');
      await removeCredentialsForBiometrics();
      setIsBiometricsEnabled(false);
    } catch (error) {
      console.error('Error disabling biometrics:', error);
    }
  };

  const authenticateWithBiometrics = async (promptMessage: string): Promise<{ success: boolean, credentials?: { email: string, password: string } }> => {
    const rnBiometrics = rnBiometricsRef.current;
    if (!rnBiometrics || !isBiometricsAvailable || !isBiometricsEnabled) {
      return { success: false };
    }

    try {
      // Sign the challenge with biometrics
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancelar',
      });

      if (success) {
        // Retrieve stored credentials
        const credentials = await getCredentialsForBiometrics();
        
        if (credentials) {
          return {
            success: true,
            credentials: {
              email: credentials.email,
              password: credentials.password
            }
          };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      return { success: false };
    }
  };

  const showBiometricPrompt = async (promptMessage: string): Promise<boolean> => {
    const rnBiometrics = rnBiometricsRef.current;
    if (!rnBiometrics || !isBiometricsAvailable) {
      return false;
    }

    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancelar',
      });

      return success;
    } catch (error) {
      console.error('Error showing biometric prompt:', error);
      return false;
    }
  };

  const saveBiometricsChoice = async (shouldEnable: boolean, email?: string, password?: string): Promise<void> => {
    await AsyncStorage.setItem('userAskedForBiometrics', 'true');
    
    if (shouldEnable && email && password) {
      await enableBiometrics(email, password);
    }
  };

  const hasUserBeenAskedForBiometrics = async (): Promise<boolean> => {
    const userAsked = await AsyncStorage.getItem('userAskedForBiometrics');
    return userAsked === 'true';
  };

  return {
    isBiometricsAvailable,
    biometricType,
    isBiometricsEnabled,
    isEnrollingBiometrics,
    enableBiometrics,
    disableBiometrics,
    authenticateWithBiometrics,
    showBiometricPrompt,
    saveBiometricsChoice,
    hasUserBeenAskedForBiometrics,
  };
};

