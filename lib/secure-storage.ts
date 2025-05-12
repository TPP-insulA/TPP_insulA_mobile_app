// BIOMETRICS TEMPORARILY DISABLED
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing secure data
const BIOMETRIC_CREDENTIALS_KEY = '@InsulaApp:biometricCredentials';

/*
interface StoredCredentials {
  email: string;
  password: string;
}

export const saveCredentialsForBiometrics = async (
  email: string, 
  password: string
): Promise<void> => {
  try {
    const credentials: StoredCredentials = { email, password };
    await AsyncStorage.setItem(
      BIOMETRIC_CREDENTIALS_KEY, 
      JSON.stringify(credentials)
    );
  } catch (error) {
    console.error('Error saving credentials for biometrics:', error);
    throw new Error('Failed to save credentials for biometric authentication');
  }
};

export const getCredentialsForBiometrics = async (): Promise<StoredCredentials | null> => {
  try {
    const credentialsJson = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
    if (!credentialsJson) return null;
    
    return JSON.parse(credentialsJson) as StoredCredentials;
  } catch (error) {
    console.error('Error retrieving credentials for biometrics:', error);
    return null;
  }
};

export const removeCredentialsForBiometrics = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
  } catch (error) {
    console.error('Error removing credentials for biometrics:', error);
  }
};
*/

// Mock implementations while biometrics are disabled
export const saveCredentialsForBiometrics = async (): Promise<void> => {};
export const getCredentialsForBiometrics = async () => null;
export const removeCredentialsForBiometrics = async (): Promise<void> => {};
