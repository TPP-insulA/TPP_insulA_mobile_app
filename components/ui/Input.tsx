import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { Body, Caption } from './typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Body style={styles.label}>{label}</Body>
      )}
      
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Feather
              name={icon}
              size={24}
              color={error ? theme.colors.error : theme.colors.text.secondary}
            />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.text.secondary}
          {...props}
        />
      </View>
      
      {error && (
        <Caption style={styles.error}>
          {error}
        </Caption>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.light,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSizes.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  error: {
    marginTop: theme.spacing.xs,
    color: theme.colors.error,
  },
}); 