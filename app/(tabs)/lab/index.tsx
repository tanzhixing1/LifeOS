import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFragmentStore } from '@/stores';

function formatLatest(timestamp: number | null) {
  if (!timestamp) return '还没有记录';
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

export default function LabHomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const fragments = useFragmentStore((s) => s.fragments);

  const stats = useMemo(() => {
    const inspirations = fragments.filter((x) => x.type === 'inspiration');
    const moods = fragments.filter((x) => x.type === 'mood');
    return {
      inspirations: inspirations.length,
      moods: moods.length,
      latestInspiration: inspirations[0]?.updatedAt ?? inspirations[0]?.createdAt ?? null,
      latestMood: moods[0]?.updatedAt ?? moods[0]?.createdAt ?? null,
    };
  }, [fragments]);

  return (
    <ScreenScaffold scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.orbit, { borderColor: palette.accentSoft }]}>
          <ThemedText style={[styles.orbitMoon, { color: palette.accentStrong }]}>☽</ThemedText>
          <ThemedText style={[styles.orbitStar, { color: palette.accentStrong }]}>✦</ThemedText>
        </View>
        <ThemedText style={[styles.kicker, { color: palette.accentStrong }]}>LAB NOTEBOOK</ThemedText>
        <ThemedText style={styles.bigTitle}>拓展实验室</ThemedText>
        <ThemedText style={[styles.subtitle, { color: palette.muted }]}>
          一间安静的小房间，用来收集情绪天气、灵感火花和一些还没成形的想法。
        </ThemedText>
        <Pressable onPress={() => router.push('/(tabs)/lab/fragments' as any)} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
          <View style={[styles.drawerPill, { borderColor: palette.accent, backgroundColor: palette.cardAlt }]}>
            <ThemedText style={[styles.drawerPillText, { color: palette.accentStrong }]}>🎲 碎片抽取</ThemedText>
          </View>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <Pressable onPress={() => router.push('/(tabs)/lab/mood')} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
          <SectionCard elevated style={[styles.entryCard, { borderColor: palette.accent }]}>
            <View style={styles.paperGlow} />
            <View style={styles.entryTop}>
              <View>
                <ThemedText style={[styles.entryIcon, { color: palette.accentStrong }]}>☽</ThemedText>
                <ThemedText style={[styles.entryKicker, { color: palette.muted }]}>MOOD OBSERVATORY</ThemedText>
              </View>
              <AppChip title={`${stats.moods} 条`} selected style={styles.entryChip} />
            </View>
            <View style={[styles.divider, { backgroundColor: palette.border }]} />
            <ThemedText style={styles.entryTitle}>心情碎片</ThemedText>
            <ThemedText style={[styles.entrySub, { color: palette.muted }]}>记录此刻的情绪、强度和一句备注。</ThemedText>
            <ThemedText style={[styles.entryMeta, { color: palette.muted }]}>最近：{formatLatest(stats.latestMood)}</ThemedText>
          </SectionCard>
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/lab/inspiration')} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
          <SectionCard elevated style={[styles.entryCard, { borderColor: palette.accent }]}>
            <View style={styles.paperGlow} />
            <View style={styles.entryTop}>
              <View>
                <ThemedText style={[styles.entryIcon, { color: palette.accentStrong }]}>✦</ThemedText>
                <ThemedText style={[styles.entryKicker, { color: palette.muted }]}>SPARK ARCHIVE</ThemedText>
              </View>
              <AppChip title={`${stats.inspirations} 条`} selected style={styles.entryChip} />
            </View>
            <View style={[styles.divider, { backgroundColor: palette.border }]} />
            <ThemedText style={styles.entryTitle}>灵感碎片</ThemedText>
            <ThemedText style={[styles.entrySub, { color: palette.muted }]}>先把火花写下来，不急着解释它。</ThemedText>
            <ThemedText style={[styles.entryMeta, { color: palette.muted }]}>最近：{formatLatest(stats.latestInspiration)}</ThemedText>
          </SectionCard>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: { gap: uiTokens.spacing.md },
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, gap: uiTokens.spacing.sm, alignItems: 'center' },
  orbit: { width: 74, height: 74, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  orbitMoon: { fontSize: 30, lineHeight: 34, fontWeight: '900' },
  orbitStar: { position: 'absolute', right: 10, top: 12, fontSize: 14, lineHeight: 16, fontWeight: '900' },
  kicker: { ...uiTokens.typography.meta, textAlign: 'center', letterSpacing: 1.2 },
  bigTitle: uiTokens.typography.screenTitle,
  subtitle: { fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  drawerPill: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: uiTokens.radius.pill,
    paddingHorizontal: uiTokens.spacing.lg,
    paddingVertical: uiTokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerPillText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  grid: { gap: uiTokens.spacing.md },
  entryCard: { padding: 18, gap: uiTokens.spacing.sm, overflow: 'hidden' },
  paperGlow: { position: 'absolute', right: -26, top: -22, width: 92, height: 92, borderRadius: 999, backgroundColor: 'rgba(209,187,222,0.16)' },
  entryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  entryIcon: { fontSize: 28, lineHeight: 32, fontWeight: '900' },
  entryKicker: { fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1.1 },
  entryChip: { paddingVertical: 6 },
  divider: { height: 1, opacity: 0.85 },
  entryTitle: { fontSize: 21, lineHeight: 27, fontWeight: '900' },
  entrySub: { fontSize: 13, lineHeight: 19, fontWeight: '800' },
  entryMeta: { fontSize: 12, lineHeight: 16, fontWeight: '800', paddingTop: 2 },
});
