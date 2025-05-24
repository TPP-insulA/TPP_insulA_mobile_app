import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from './use-auth';

export const useGoogleAuth = () => {
  const { login } = useAuth();

  const configureGoogleSignIn = () => {
    console.log('[GoogleAuth] Configuring Google Sign-In...');
    try {
      GoogleSignin.configure({
        webClientId: '345938546990-0uq4oq5nht5teo9vncf3an2b6hmnu1qo.apps.googleusercontent.com',
        offlineAccess: true,
        scopes: ['profile', 'email'],
        forceCodeForRefreshToken: true,
      });
      console.log('[GoogleAuth] Google Sign-In configured successfully');
    } catch (error) {
      console.error('[GoogleAuth] Error configuring Google Sign-In:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    console.log('[GoogleAuth] Starting Google Sign-In process...');
    try {
      console.log('[GoogleAuth] Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      console.log('[GoogleAuth] Play Services available');

      console.log('[GoogleAuth] Attempting to sign in...');
      await GoogleSignin.signIn();
      
      // Get the current user info after sign in
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('[GoogleAuth] Current user info:', currentUser);

      if (!currentUser?.user) {
        throw new Error('Failed to get user information');
      }

      const userInfo = currentUser.user;
      console.log('[GoogleAuth] Sign-In successful:', {
        email: userInfo.email,
        id: userInfo.id,
        name: userInfo.name,
        photo: userInfo.photo,
        familyName: userInfo.familyName,
        givenName: userInfo.givenName
      });

      return userInfo;
    } catch (error: any) {
      console.error('[GoogleAuth] Sign-In error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleAuth] Sign in cancelled by user');
        throw new Error('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[GoogleAuth] Sign in already in progress');
        throw new Error('Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('[GoogleAuth] Play services not available');
        throw new Error('Play services not available');
      } else {
        console.error('[GoogleAuth] Unknown error occurred:', error);
        throw new Error('Unknown error occurred');
      }
    }
  };

  const signOut = async () => {
    console.log('[GoogleAuth] Attempting to sign out...');
    try {
      await GoogleSignin.signOut();
      console.log('[GoogleAuth] Sign out successful');
    } catch (error) {
      console.error('[GoogleAuth] Error signing out:', error);
      throw error;
    }
  };

  return {
    configureGoogleSignIn,
    signInWithGoogle,
    signOut,
  };
}; 