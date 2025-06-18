import { create } from "zustand"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persist, createJSONStorage } from "zustand/middleware"
import { loginUser, registerUser, getUserProfile, ApiUserData } from '../lib/api/auth'
import { GlucoseProfile, User } from '../types'
import { StateCreator } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  initialized: boolean
  
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    birthDay: number
    birthMonth: number
    birthYear: number
    weight: number
    height: number
    glucoseProfile: GlucoseProfile
  }) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
  initialize: () => Promise<void>
}

type AuthStateCreator = StateCreator<
  AuthState,
  [],
  [["zustand/persist", unknown]],
  AuthState
>;

function hasRequiredUserFields(user: ApiUserData): boolean {
  return !!(
    user.id &&
    user.email &&
    user.firstName &&
    user.lastName &&
    user.birthDay !== undefined &&
    user.birthMonth !== undefined &&
    user.birthYear !== undefined &&
    user.weight !== undefined &&
    user.height !== undefined &&
    user.glucoseProfile
  );
}

export const useAuth = create<AuthState>()(
  persist(
    ((set, get): AuthState => ({
      user: null,
      token: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      initialized: false,
      
      initialize: async () => {
        const state = get();
        if (!state.initialized) {
          if (state.token) {
            await state.loadUser();
          } else {
            set({ isLoading: false });
          }
          set({ initialized: true });
        }
      },

      login: async (email: string, password: string): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          const response = await loginUser({ email, password });
          const { data: { user, token } } = response;
          
          if (hasRequiredUserFields(user)) {
            set({ 
              token,
              isAuthenticated: true,
              user: user as unknown as User,
              isLoading: false 
            });
          } else {
            throw new Error('Invalid user data received from server');
          }
        } catch (error: unknown) {
          const errorMessage: string = error instanceof Error ? error.message : 'Error al iniciar sesión';
          set({ error: errorMessage, isLoading: false, isAuthenticated: false });
          throw error;
        }
      },
      
      register: async (userData): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          const response = await registerUser(userData);
          console.log('Register response:', response);
          
          const { data: { user, token } } = response;
          
          if (hasRequiredUserFields(user)) {
            set({ 
              token,
              user: user as unknown as User,
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            throw new Error('Invalid user data received from server');
          }
        } catch (error: unknown) {
          const errorMessage: string = error instanceof Error ? error.message : 'Error al registrar usuario';
          set({ error: errorMessage, isLoading: false, isAuthenticated: false });
          throw error;
        }
      },
      
      logout: async (): Promise<void> => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false,
          error: null 
        });
      },
      
      loadUser: async (): Promise<void> => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const user = await getUserProfile(token);
          
          if (hasRequiredUserFields(user)) {
            set({ 
              user: user as unknown as User,
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            throw new Error('Invalid user data received from server');
          }
        } catch (error) {
          console.error('LoadUser error:', error);
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
      
      clearError: (): void => set({ error: null })
    })) as AuthStateCreator,
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)