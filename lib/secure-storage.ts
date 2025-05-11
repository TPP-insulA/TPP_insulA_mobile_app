import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing secure data
const BIOMETRIC_CREDENTIALS_KEY = '@InsulaApp:biometricCredentials';

/**
 * Interface for stored credentials
 */
interface StoredCredentials {
  email: string;
  password: string;
}

/**
 * Save credentials for biometric login
 * Note: In a production app, consider using react-native-keychain or
 * similar libraries for more secure storage of credentials
 */
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

/**
 * Retrieve credentials for biometric login
 */
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

/**
 * Remove stored credentials when biometric login is disabled
 */
export const removeCredentialsForBiometrics = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
  } catch (error) {
    console.error('Error removing credentials for biometrics:', error);
  }
};
