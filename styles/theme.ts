import { create } from 'twrnc';

// Create the default instance of twrnc with colors matching react-native-paper theme
export const tw = create({
  theme: {
    extend: {
      colors: {
        'apple-green': '#4CAF50',
        'apple-green-light': '#81C784',
        'apple-green-dark': '#388E3C',
        'background-light': '#F5F5F5',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'border': '#E5E5E5',
        'card': '#FFFFFF',
      },
    },
  },
});

export const theme = {
  colors: {
    primary: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    background: {
      main: '#FFFFFF',
      light: '#F5F5F5',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    error: '#FF5252',
    divider: '#E5E5E5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    full: 9999,
  },
  typography: {
    fontFamily: 'System',
    fontSizes: {
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    letterSpacing: {
      normal: 0,
      wide: 0.5,
    },
    lineHeights: {
      normal: 1.5,
      tight: 1.2,
    },
  },
  animations: {
    duration: {
      fast: 200,
      medium: 300,
      slow: 500,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
} as const;

export default theme;