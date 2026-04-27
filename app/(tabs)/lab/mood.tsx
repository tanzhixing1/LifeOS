import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function MoodScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
        </Pressable>
        <ThemedText style={styles.bigTitle}>心情碎片（列表）</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText style={styles.cardTitle}>最近记录</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>空空如也。你还好吗？</ThemedText>
      </View>

      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.92 : 1 }]}>
        <ThemedText style={styles.primaryText}>+ 记录一条</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 8 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  primaryBtn: { marginTop: 12, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#1D1B1E', fontSize: 15, lineHeight: 18, fontWeight: '900' },
});
