import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import demoPackJson from '@/features/game/content/demo/events.json';
import { demoLocations } from '@/features/game/content/demo/locations';
import { evaluateCondition } from '@/features/game/engine/executor';
import { formatGameTime, formatOpenHours, isLocationOpen } from '@/features/game/engine/time';
import type { ContentPack, EventNode, GameLocation, PlayerState } from '@/features/game/engine/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

export default function GameMapScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const pack = demoPackJson as ContentPack;
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((e) => [e.id, e])), [pack.events]);

  const player = useGameStore((s) => s.player);
  const setLocation = useGameStore((s) => s.setLocation);
  const gotoEvent = useGameStore((s) => s.gotoEvent);
  const locations = useMemo(() => getAvailableLocations(demoLocations, player), [player]);

  function enterLocation(location: GameLocation) {
    setLocation(location.id);
    const nextEventId = eventsById.has(location.entryEventId) ? location.entryEventId : pack.startEventId;
    gotoEvent(nextEventId);
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
        <View style={[styles.statusBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>{formatGameTime(player.gameTime)}</ThemedText>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>疲劳 {player.vitals.fatigue}</ThemedText>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>金钱 {player.wallet.money}G</ThemedText>
        </View>
      </View>

      <View style={[styles.mapPlaceholder, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText style={[styles.placeholderText, { color: mutedText }]}>地图节点插画（占位）</ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText style={styles.cardTitle}>地点</ThemedText>
        <View style={styles.nodeGrid}>
          {locations.map((location) => {
            const open = isLocationOpen(location, player.gameTime);
            const hoursLabel = formatOpenHours(location.openHours);
            const isCurrent = player.location === location.id;

            return (
              <Pressable
                key={location.id}
                onPress={() => enterLocation(location)}
                style={({ pressed }) => [
                  styles.nodeBtn,
                  {
                    borderColor: isCurrent ? accent : cardBorder,
                    backgroundColor: isCurrent ? 'rgba(209,187,222,0.12)' : 'transparent',
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <View style={styles.nodeMetaRow}>
                  <ThemedText style={styles.nodeIcon}>{location.icon ?? '??'}</ThemedText>
                  <View
                    style={[
                      styles.nodeStatus,
                      {
                        borderColor: open ? accent : cardBorder,
                        backgroundColor: open ? 'rgba(209,187,222,0.14)' : 'rgba(122,117,111,0.08)',
                      },
                    ]}>
                    <ThemedText style={[styles.nodeStatusText, { color: open ? accent : mutedText }]}>
                      {open ? '营业中' : '尚未营业'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.nodeText, { color: accent }]}>{location.name}</ThemedText>
                <ThemedText style={[styles.nodeSub, { color: mutedText }]} numberOfLines={2}>
                  {location.subtitle ?? location.description}
                </ThemedText>
                <ThemedText style={[styles.nodeHours, { color: mutedText }]}>{hoursLabel ?? '全天开放'}</ThemedText>
                {isCurrent ? (
                  <ThemedText style={[styles.nodeCurrent, { color: accent }]}>当前位置</ThemedText>
                ) : null}
              </Pressable>
            );
          })}
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
  statusBar: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  mapPlaceholder: { borderWidth: 1, borderRadius: 18, padding: 18, height: 180, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12, marginTop: 12 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  nodeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nodeBtn: { width: '48%', borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, gap: 5 },
  nodeMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nodeStatus: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  nodeStatusText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  nodeIcon: { fontSize: 20, lineHeight: 24 },
  nodeText: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  nodeSub: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  nodeHours: { fontSize: 10, lineHeight: 13, fontWeight: '800' },
  nodeCurrent: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
});

function getAvailableLocations(locations: GameLocation[], player: PlayerState): GameLocation[] {
  return locations.filter((location) => isLocationUnlocked(location, player));
}

function isLocationUnlocked(location: GameLocation, player: PlayerState): boolean {
  if (!location.unlockRequirements || location.unlockRequirements.length === 0) return true;
  return location.unlockRequirements.every((condition) => evaluateCondition(condition, player));
}
