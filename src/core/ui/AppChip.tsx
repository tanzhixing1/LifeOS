import React from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uiTokens } from '@/core/theme/tokens';

type AppChipProps = Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  children?: React.ReactNode;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppChip({ title, children, selected = false, disabled, style, textStyle, ...rest }: AppChipProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? palette.accent : 'transparent',
          borderColor: selected ? palette.accent : palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
        },
        style,
      ]}
      {...rest}>
      {children ?? (
        <ThemedText style={[styles.text, { color: selected ? '#1D1B1E' : palette.muted }, textStyle]}>{title}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderRadius: uiTokens.radius.pill,
    paddingHorizontal: uiTokens.spacing.lg,
    paddingVertical: uiTokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...uiTokens.typography.chip,
  },
});
