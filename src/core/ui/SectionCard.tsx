import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { softShadow, uiTokens } from '@/core/theme/tokens';

type SectionCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
};

export function SectionCard({ children, style, elevated = false }: SectionCardProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? palette.card : palette.cardAlt,
          borderColor: palette.border,
        },
        elevated ? softShadow : undefined,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    padding: uiTokens.spacing.lg,
    gap: uiTokens.layout.cardGap,
  },
});
