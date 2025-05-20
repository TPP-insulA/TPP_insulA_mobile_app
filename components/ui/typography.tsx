import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface TypographyProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  color?: string;
}

export const Title: React.FC<TypographyProps> = ({ 
  style, 
  variant = 'title',
  color = theme.colors.text.primary,
  ...props 
}) => (
  <Text
    style={[
      styles.title,
      { color },
      style,
    ]}
    {...props}
  />
);

export const Subtitle: React.FC<TypographyProps> = ({ 
  style, 
  variant = 'subtitle',
  color = theme.colors.text.secondary,
  ...props 
}) => (
  <Text
    style={[
      styles.subtitle,
      { color },
      style,
    ]}
    {...props}
  />
);

export const Body: React.FC<TypographyProps> = ({ 
  style, 
  variant = 'body',
  color = theme.colors.text.primary,
  ...props 
}) => (
  <Text
    style={[
      styles.body,
      { color },
      style,
    ]}
    {...props}
  />
);

export const Caption: React.FC<TypographyProps> = ({ 
  style, 
  variant = 'caption',
  color = theme.colors.text.secondary,
  ...props 
}) => (
  <Text
    style={[
      styles.caption,
      { color },
      style,
    ]}
    {...props}
  />
);

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    letterSpacing: theme.typography.letterSpacing.wide,
    lineHeight: theme.typography.lineHeights.tight,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    letterSpacing: theme.typography.letterSpacing.normal,
    lineHeight: theme.typography.lineHeights.normal,
  },
  body: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.regular,
    letterSpacing: theme.typography.letterSpacing.normal,
    lineHeight: theme.typography.lineHeights.normal,
  },
  caption: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    letterSpacing: theme.typography.letterSpacing.normal,
    lineHeight: theme.typography.lineHeights.normal,
  },
}); 