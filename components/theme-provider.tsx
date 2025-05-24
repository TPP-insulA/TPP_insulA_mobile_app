import * as React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { DefaultTheme } from '@react-navigation/native';

const paperTheme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    regular: {
      fontFamily: 'Roboto-Regular',
    },
    medium: {
      fontFamily: 'Roboto-Medium',
    },
    light: {
      fontFamily: 'Roboto-Regular',
    },
    thin: {
      fontFamily: 'Roboto-Regular',
    },
  },
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4CAF50',
    secondary: '#81C784',
    background: '#F5F5F5',
    text: '#333333',
    textSecondary: '#666666',
  },
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4CAF50',
    background: '#F5F5F5',
    text: '#333333',
    border: '#E5E5E5',
    card: '#FFFFFF',
  },
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <PaperProvider theme={paperTheme}>
      {children}
    </PaperProvider>
  );
}
