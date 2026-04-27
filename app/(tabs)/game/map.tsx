import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ContentPack, EventNode, MapNode } from '@/features/game/engine/types';
import demoPackJson from '@/features/game/content/demo/events.json';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

export default function GameMapScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const pack = demoPackJson as ContentPack;
  const nodes = (pack.map ?? []) as MapNode[];
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((e) => [e.id, e])), [pack.events]);

  const setLocation = useGameStore((s) => s.setLocation);
  const gotoEvent = useGameStore((s) => s.gotoEvent);

  function locationToEvent(locationId: string): string {
    if (locationId === 'street') return 'demo_street';
    if (locationId === 'market') return 'demo_market';
    if (locationId === 'room') return 'demo_room';
    return pack.startEventId;
  }

  function enterLocation(locationId: string) {
    setLocation(locationId);
    const nextEventId = locationToEvent(locationId);
    gotoEvent(eventsById.has(nextEventId) ? nextEventId : pack.startEventId);
    router.push('/(tabs)/game/play');
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>地图</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>地点跳转式地图（初版）</ThemedText>
      </View>

      <View style={[styles.mapPlaceholder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText style={[styles.placeholderText, { color: mutedText }]}>地图节点插画（占位）</ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText style={styles.cardTitle}>地点</ThemedText>
        <View style={styles.nodeGrid}>
          {nodes.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => enterLocation(n.id)}
              style={({ pressed }) => [
                styles.nodeBtn,
                { borderColor: accent, opacity: pressed ? 0.92 : 1 },
              ]}>
              <ThemedText style={[styles.nodeText, { color: accent }]}>{n.name}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },

  mapPlaceholder: { borderWidth: 1, borderRadius: 18, padding: 18, height: 180, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 14, lineHeight: 18, fontWeight: '800' },

  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12, marginTop: 12 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  nodeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nodeBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  nodeText: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
});

