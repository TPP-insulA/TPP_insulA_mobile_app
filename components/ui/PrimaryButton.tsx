import React, { useEffect } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { Title } from './typography';

interface PrimaryButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
}) => {
  const scaleAnim = new Animated.Value(1);
  const opacityAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: theme.animations.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: theme.animations.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: theme.animations.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: theme.animations.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={styles.touchable}
      >
        <LinearGradient
          colors={[
            theme.colors.primary.main,
            theme.colors.primary.light,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            disabled && styles.disabled,
          ]}
        >
          <Title
            style={[
              styles.text,
              textStyle,
            ]}
          >
            {title}
          </Title>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.shadows.medium,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
  },
  touchable: {
    width: '100%',
  },
  gradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.background.main,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
}); 