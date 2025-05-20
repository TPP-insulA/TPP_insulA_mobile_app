import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { Subtitle } from './typography';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: keyof typeof Feather.glyphMap;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  icon = 'chevron-down',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: theme.animations.duration.medium,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: theme.animations.duration.medium,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.header}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <Subtitle>{title}</Subtitle>
        </View>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                {
                  rotate: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Feather
            name={icon}
            size={24}
            color={theme.colors.text.secondary}
          />
        </Animated.View>
      </TouchableOpacity>
      
      {isExpanded && (
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.main,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.main,
  },
  titleContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
}); 