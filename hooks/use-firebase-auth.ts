import { getAuth, GoogleAuthProvider, signInWithCredential, createUserWithEmailAndPassword as firebaseCreateUser, signInWithEmailAndPassword as firebaseSignIn, signOut as firebaseSignOut, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Custom error class for Firebase auth errors
class FirebaseAuthError extends Error {
  code: string;
  originalError?: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'FirebaseAuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const useFirebaseAuth = () => {
  const signInWithGoogle = async () => {
    console.log('[FirebaseAuth] Starting Google Sign-In process...');
    try {
      // Check if Google Sign-In is configured
      if (!GoogleSignin.configure) {
        throw new FirebaseAuthError(
          'Google Sign-In is not properly configured',
          'auth/google-signin-not-configured'
        );
      }

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      if (!idToken) {
        throw new FirebaseAuthError(
          'No ID token received from Google Sign-In',
          'auth/no-id-token'
        );
      }
      console.log('[FirebaseAuth] Got Google ID token');

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      if (!googleCredential) {
        throw new FirebaseAuthError(
          'Failed to create Google credential',
          'auth/invalid-credential'
        );
      }
      console.log('[FirebaseAuth] Created Google credential');

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(getAuth(), googleCredential);
      if (!userCredential?.user) {
        throw new FirebaseAuthError(
          'No user data received after successful sign-in',
          'auth/no-user-data'
        );
      }
      console.log('[FirebaseAuth] Firebase sign-in successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });

      return userCredential.user;
    } catch (error: any) {
      console.error('[FirebaseAuth] Error during Google Sign-In:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new FirebaseAuthError(
          'Google Sign-In was cancelled by the user',
          'auth/google-signin-cancelled'
        );
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new FirebaseAuthError(
          'Google Sign-In is already in progress',
          'auth/google-signin-in-progress'
        );
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new FirebaseAuthError(
          'Google Play Services are not available',
          'auth/google-play-services-not-available'
        );
      }

      // Handle Firebase auth errors
      if (error.code?.startsWith('auth/')) {
        throw new FirebaseAuthError(
          error.message || 'Firebase authentication failed',
          error.code,
          error
        );
      }

      // Handle unknown errors
      throw new FirebaseAuthError(
        error.message || 'An unknown error occurred during Google Sign-In',
        'auth/unknown-error',
        error
      );
    }
  };

  const createUserWithEmailAndPassword = async (email: string, password: string) => {
    console.log('[FirebaseAuth] Creating user with email and password...');
    try {
      if (!email || !password) {
        throw new FirebaseAuthError(
          'Email and password are required',
          'auth/invalid-email-password'
        );
      }

      const userCredential = await firebaseCreateUser(getAuth(), email, password);
      if (!userCredential?.user) {
        throw new FirebaseAuthError(
          'No user data received after account creation',
          'auth/no-user-data'
        );
      }
      console.log('[FirebaseAuth] User created successfully:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });
      return userCredential.user;
    } catch (error: any) {
      console.error('[FirebaseAuth] Error creating user:', error);
      
      // Handle specific Firebase auth errors
      if (error.code?.startsWith('auth/')) {
        throw new FirebaseAuthError(
          error.message || 'Failed to create user account',
          error.code,
          error
        );
      }

      throw new FirebaseAuthError(
        error.message || 'An unknown error occurred while creating user',
        'auth/unknown-error',
        error
      );
    }
  };

  const signInWithEmailAndPassword = async (email: string, password: string) => {
    console.log('[FirebaseAuth] Signing in with email and password...');
    try {
      if (!email || !password) {
        throw new FirebaseAuthError(
          'Email and password are required',
          'auth/invalid-email-password'
        );
      }

      const userCredential = await firebaseSignIn(getAuth(), email, password);
      if (!userCredential?.user) {
        throw new FirebaseAuthError(
          'No user data received after sign-in',
          'auth/no-user-data'
        );
      }
      console.log('[FirebaseAuth] User signed in successfully:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });
      return userCredential.user;
    } catch (error: any) {
      console.error('[FirebaseAuth] Error signing in:', error);
      
      // Handle specific Firebase auth errors
      if (error.code?.startsWith('auth/')) {
        throw new FirebaseAuthError(
          error.message || 'Failed to sign in',
          error.code,
          error
        );
      }

      throw new FirebaseAuthError(
        error.message || 'An unknown error occurred while signing in',
        'auth/unknown-error',
        error
      );
    }
  };

  const signOut = async () => {
    console.log('[FirebaseAuth] Signing out...');
    try {
      await firebaseSignOut(getAuth());
      await GoogleSignin.signOut();
      console.log('[FirebaseAuth] Sign out successful');
    } catch (error: any) {
      console.error('[FirebaseAuth] Error signing out:', error);
      throw new FirebaseAuthError(
        error.message || 'Failed to sign out',
        'auth/sign-out-failed',
        error
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      if (!firebaseUser?.email) {
        throw new FirebaseAuthError(
          'No email received from Google Sign-In',
          'auth/no-email'
        );
      }
      return firebaseUser;
    } catch (error: any) {
      console.error('[FirebaseAuth] Error in handleGoogleSignIn:', error);
      if (error instanceof FirebaseAuthError) {
        throw error;
      }
      throw new FirebaseAuthError(
        error.message || 'Failed to complete Google Sign-In',
        'auth/google-signin-failed',
        error
      );
    }
  };

  const handleEmailSignUp = async (email: string, password: string, userData: any) => {
    try {
      if (!email || !password) {
        throw new FirebaseAuthError(
          'Email and password are required',
          'auth/invalid-email-password'
        );
      }

      const firebaseUser = await createUserWithEmailAndPassword(email, password);
      if (!firebaseUser) {
        throw new FirebaseAuthError(
          'Failed to create user account',
          'auth/user-creation-failed'
        );
      }
      return firebaseUser;
    } catch (error: any) {
      console.error('[FirebaseAuth] Error in handleEmailSignUp:', error);
      if (error instanceof FirebaseAuthError) {
        throw error;
      }
      throw new FirebaseAuthError(
        error.message || 'Failed to complete email sign up',
        'auth/email-signup-failed',
        error
      );
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new FirebaseAuthError(
          'Email and password are required',
          'auth/invalid-email-password'
        );
      }

      const firebaseUser = await signInWithEmailAndPassword(email, password);
      if (!firebaseUser) {
        throw new FirebaseAuthError(
          'Failed to sign in with email and password',
          'auth/email-signin-failed'
        );
      }
      return firebaseUser;
    } catch (error: any) {
      console.error('[FirebaseAuth] Error in handleEmailSignIn:', error);
      if (error instanceof FirebaseAuthError) {
        throw error;
      }
      throw new FirebaseAuthError(
        error.message || 'Failed to complete email sign in',
        'auth/email-signin-failed',
        error
      );
    }
  };

  return {
    handleGoogleSignIn,
    handleEmailSignUp,
    handleEmailSignIn,
    signOut
  };
}; 