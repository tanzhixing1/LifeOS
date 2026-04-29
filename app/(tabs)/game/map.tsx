import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import demoPackJson from '@/features/game/content/demo/events.json';
import { demoLocations } from '@/features/game/content/demo/locations';
import { demoNpcSchedules, demoNpcs } from '@/features/game/content/demo/npcs';
import { evaluateCondition } from '@/features/game/engine/executor';
import { getNpcsAtLocation } from '@/features/game/engine/npc';
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
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((event) => [event.id, event])), [pack.events]);

  const player = useGameStore((s) => s.player);
  const setLocation = useGameStore((s) => s.setLocation);
  const gotoEvent = useGameStore((s) => s.gotoEvent);
  const locations = useMemo(() => demoLocations.filter((location) => isLocationUnlocked(location, player)), [player]);

  function enterLocation(location: GameLocation) {
    if (!isLocationOpen(location, player.gameTime)) {
      const hoursLabel = formatOpenHours(location.openHours) ?? '全天开放';
      const message = location.id === 'bar' ? '酒吧会在 20:00 后开门。' : `${location.name} 会在 ${hoursLabel} 时开放。`;
      Alert.alert('尚未营业', message);
      return;
    }

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
          <ThemedText style={styles.bigTitle}>雾莓镇</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.statusBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>{formatGameTime(player.gameTime)}</ThemedText>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>疲劳 {player.vitals.fatigue}</ThemedText>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>金钱 {player.wallet.money}G</ThemedText>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardGrid}>
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              isCurrent={player.location === location.id}
              player={player}
              accent={accent}
              cardBorder={cardBorder}
              mutedText={mutedText}
              onPress={() => enterLocation(location)}
            />
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

type LocationCardProps = {
  location: GameLocation;
  isCurrent: boolean;
  player: PlayerState;
  accent: string;
  cardBorder: string;
  mutedText: string;
  onPress: () => void;
};

function LocationCard({ location, isCurrent, player, accent, cardBorder, mutedText, onPress }: LocationCardProps) {
  const open = isLocationOpen(location, player.gameTime);
  const hoursLabel = formatOpenHours(location.openHours);
  const visibleNpcs = getNpcsAtLocation(location.id, player.gameTime, demoNpcs, demoNpcSchedules, demoLocations);
  const visibleNpcNames = visibleNpcs.map((npc) => npc.name).join('、');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.nodeBtn,
        {
          borderColor: isCurrent ? accent : cardBorder,
          backgroundColor: isCurrent ? 'rgba(209,187,222,0.12)' : 'rgba(255,255,255,0.14)',
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.nodeTopRow}>
        <ThemedText style={styles.nodeIcon}>{location.icon ?? '•'}</ThemedText>
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

      <ThemedText style={[styles.nodeName, { color: accent }]} numberOfLines={1}>
        {location.name}
      </ThemedText>
      <ThemedText style={[styles.nodeSubtitle, { color: mutedText }]} numberOfLines={1}>
        {location.subtitle ?? ' '}
      </ThemedText>
      {visibleNpcNames ? (
        <ThemedText style={[styles.nodeNpc, { color: accent }]} numberOfLines={1}>
          可遇见：{visibleNpcNames}
        </ThemedText>
      ) : null}
      <ThemedText style={[styles.nodeHours, { color: mutedText }]} numberOfLines={1}>
        {hoursLabel ?? '全天开放'}
      </ThemedText>
      {isCurrent ? <ThemedText style={[styles.nodeCurrent, { color: accent }]}>当前位置</ThemedText> : null}
    </Pressable>
  );
}

function isLocationUnlocked(location: GameLocation, player: PlayerState): boolean {
  if (!location.unlockRequirements || location.unlockRequirements.length === 0) return true;
  return location.unlockRequirements.every((condition) => evaluateCondition(condition, player));
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
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
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nodeBtn: {
    width: '48%',
    minHeight: 138,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
    justifyContent: 'space-between',
  },
  nodeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nodeIcon: { fontSize: 20, lineHeight: 24 },
  nodeStatus: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  nodeStatusText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  nodeName: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  nodeSubtitle: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  nodeNpc: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
  nodeHours: { fontSize: 10, lineHeight: 13, fontWeight: '800' },
  nodeCurrent: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
});
