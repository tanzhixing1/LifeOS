import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uiTokens } from '@/core/theme/tokens';

type ScreenScaffoldProps = {
  children: React.ReactNode;
  scroll?: boolean;
  withTabPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({
  children,
  scroll = false,
  withTabPadding = true,
  style,
  contentContainerStyle,
}: ScreenScaffoldProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomPadding = withTabPadding ? tabBarHeight + insets.bottom + uiTokens.layout.tabBarExtraPadding : uiTokens.spacing.xl;

  if (scroll) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: palette.page }, style]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, contentContainerStyle]}>
          {children}
        </ScrollView>
      </ThemedView>
    );
  }

  return <ThemedView style={[styles.screen, { backgroundColor: palette.page }, style]}>{children}</ThemedView>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: uiTokens.layout.screenPaddingX,
    paddingTop: uiTokens.layout.screenPaddingTop,
  },
  scrollContent: {
    gap: uiTokens.spacing.md,
  },
});
