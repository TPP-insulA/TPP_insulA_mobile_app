import { useState, useEffect } from 'react';
import firebase from '../lib/firebase';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useFirebaseAuth } from './use-firebase-auth';
import { loginUser, registerUser } from '../lib/api/auth';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleEmailSignIn: firebaseEmailSignIn, handleEmailSignUp: firebaseEmailSignUp, handleGoogleSignIn: firebaseGoogleSignIn } = useFirebaseAuth();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user: FirebaseAuthTypes.User | null) => {
      console.log('[useAuth] Auth state changed:', {
        isAuthenticated: !!user,
        email: user?.email,
        uid: user?.uid
      });
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const initialize = async () => {
    try {
      console.log('[useAuth] Initializing auth state...');
      // The auth state will be handled by the useEffect above
      setIsLoading(false);
    } catch (err: any) {
      console.error('[useAuth] Initialization error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[useAuth] Attempting login...');
      // First sign in with Firebase
      const firebaseUser = await firebaseEmailSignIn(email, password);
      
      // Then login with the backend
      const response = await loginUser({ email, password });
      if (!response.success) {
        throw new Error('Error al iniciar sesión');
      }

      console.log('[useAuth] Login successful:', {
        email: firebaseUser?.email,
        uid: firebaseUser?.uid
      });
      return firebaseUser;
    } catch (err: any) {
      console.error('[useAuth] Login error:', err);
      throw err;
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('[useAuth] Attempting registration...');
      // First create user in Firebase
      const firebaseUser = await firebaseEmailSignUp(userData.email, userData.password, userData);
      
      // Then register with the backend
      const response = await registerUser(userData);
      if (!response.success) {
        // If backend registration fails, delete the Firebase user
        await firebaseUser.delete();
        throw new Error('Error al registrar usuario');
      }

      console.log('[useAuth] Registration successful:', {
        email: firebaseUser?.email,
        uid: firebaseUser?.uid
      });
      return firebaseUser;
    } catch (err: any) {
      console.error('[useAuth] Registration error:', err);
      throw err;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('[useAuth] Starting Google Sign-In process...');
      const firebaseUser = await firebaseGoogleSignIn();
      
      if (firebaseUser?.email) {
        try {
          // Try to login with the backend
          const response = await loginUser({ email: firebaseUser.email, password: '' });
          if (!response.success) {
            // If user doesn't exist in backend, return the Firebase user
            // so the UI can handle registration
            return firebaseUser;
          }
        } catch (error: any) {
          if (error.message === 'User not found') {
            // If user doesn't exist in backend, return the Firebase user
            // so the UI can handle registration
            return firebaseUser;
          }
          throw error;
        }
      }
      throw new Error('No email received from Google Sign-In');
    } catch (error: any) {
      console.error('[useAuth] Google Sign-In error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[useAuth] Attempting logout...');
      await auth().signOut();
      console.log('[useAuth] Logout successful');
    } catch (err: any) {
      console.error('[useAuth] Logout error:', err);
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    initialize,
    handleGoogleSignIn,
    isAuthenticated: !!user
  };
}