import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LabHomeScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const accent = useThemeColor({ light: '#6366F1', dark: '#6366F1' }, 'tint');

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.bigTitle}>扩展（实验室）</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>
          你想写就写。不想写也行。但别骗我说你写了。
        </ThemedText>
      </View>

      <View style={styles.grid}>
        <Pressable
          onPress={() => router.push('/(tabs)/lab/mood')}
          style={({ pressed }) => [
            styles.entryCard,
            { backgroundColor: cardBg, borderColor: accent, opacity: pressed ? 0.92 : 1 },
          ]}>
          <ThemedText style={styles.entryTitle}>心情碎片</ThemedText>
          <ThemedText style={[styles.entrySub, { color: mutedText }]}>记一条。别憋着。</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/lab/inspiration')}
          style={({ pressed }) => [
            styles.entryCard,
            { backgroundColor: cardBg, borderColor: accent, opacity: pressed ? 0.92 : 1 },
          ]}>
          <ThemedText style={styles.entryTitle}>灵感碎片</ThemedText>
          <ThemedText style={[styles.entrySub, { color: mutedText }]}>闪一下就记。别等它跑。</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  bigTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  grid: { gap: 12 },
  entryCard: { borderWidth: 1.5, borderRadius: 18, padding: 16, gap: 8 },
  entryTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  entrySub: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
});
