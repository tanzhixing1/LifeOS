import React from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uiTokens } from '@/core/theme/tokens';

type AppButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

type AppButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  children?: React.ReactNode;
  variant?: AppButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppButton({ title, children, variant = 'primary', disabled, style, textStyle, ...rest }: AppButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? { backgroundColor: palette.accent, borderColor: palette.accent } : undefined,
        variant === 'outline' ? { backgroundColor: 'transparent', borderColor: palette.border } : undefined,
        variant === 'danger' ? { backgroundColor: palette.danger, borderColor: palette.danger } : undefined,
        variant === 'ghost' ? { backgroundColor: 'transparent', borderColor: 'transparent' } : undefined,
        { opacity: disabled ? 0.45 : pressed ? 0.88 : 1 },
        style,
      ]}
      {...rest}>
      {children ?? (
        <ThemedText
          style={[
            styles.text,
            {
              color: variant === 'primary' ? '#1D1B1E' : variant === 'danger' ? '#fff' : palette.muted,
            },
            textStyle,
          ]}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: uiTokens.radius.lg,
    paddingHorizontal: uiTokens.spacing.lg,
    paddingVertical: uiTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...uiTokens.typography.button,
    textAlign: 'center',
  },
});
