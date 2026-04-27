import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AiHomeScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.bigTitle}>AI 互动（占位）</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>
          目前不接真实 API。这里先保留页面入口，未来会读取“今日打卡摘要”等全局数据，生成夸夸/损损反馈。
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  bigTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
});

