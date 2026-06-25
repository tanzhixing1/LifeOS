import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mainContentPack, mainLocations, mainNpcs, mainNpcSchedules } from '@/features/game/content/main';
import { evaluateCondition } from '@/features/game/engine/executor';
import { getNpcsAtLocation } from '@/features/game/engine/npc';
import { formatGameTime, formatOpenHours, isLocationOpen } from '@/features/game/engine/time';
import type { EventNode, GameLocation, PlayerState } from '@/features/game/engine/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';
import { useWalletStore } from '@/stores/walletStore';

export default function GameMapScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const pack = mainContentPack;
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((event) => [event.id, event])), [pack.events]);

  const player = useGameStore((s) => s.player);
  const gold = useWalletStore((s) => s.currencies.gold);
  const setLocation = useGameStore((s) => s.setLocation);
  const gotoEvent = useGameStore((s) => s.gotoEvent);
  const markResumeMap = useGameStore((s) => s.markResumeMap);
  const markResumePlay = useGameStore((s) => s.markResumePlay);
  const locations = useMemo(() => mainLocations.filter((location) => isLocationUnlocked(location, player)), [player]);

  useEffect(() => {
    markResumeMap(useGameStore.getState().player.location);
  }, [markResumeMap]);

  function enterLocation(location: GameLocation) {
    if (!isLocationOpen(location, player.gameTime)) {
      const hoursLabel = formatOpenHours(location.openHours) ?? '全天开放';
      const message = location.id === 'bar' ? '酒吧会在 20:00 之后开门。' : `${location.name} 会在 ${hoursLabel} 时开放。`;
      Alert.alert('尚未营业', message);
      return;
    }

    setLocation(location.id);
    const nextEventId = eventsById.has(location.entryEventId) ? location.entryEventId : pack.startEventId;
    gotoEvent(nextEventId);
    markResumePlay(nextEventId, location.id);
    router.replace(`/(tabs)/game/play?mode=continue&eventId=${encodeURIComponent(nextEventId)}&locationId=${encodeURIComponent(location.id)}`);
  }

  function openShop(location: GameLocation) {
    if (!location.shopId) return;
    router.push({ pathname: '/(tabs)/game/shop', params: { from: 'map' } });
  }

  function openWorkBoard() {
    router.push({ pathname: '/(tabs)/game/work', params: { from: 'map' } });
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.replace('/(tabs)/game')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
            </Pressable>
            <ThemedText style={styles.bigTitle}>雾莓镇</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.statusBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.statusText, { color: mutedText }]}>{formatGameTime(player.gameTime)}</ThemedText>
            <ThemedText style={[styles.statusText, { color: mutedText }]}>疲劳 {player.vitals.fatigue}</ThemedText>
            <ThemedText style={[styles.statusText, { color: mutedText }]}>金币 {gold}G</ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Pressable
            onPress={openWorkBoard}
            style={({ pressed }) => [
              styles.workEntry,
              {
                borderColor: accent,
                backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.12)',
              },
            ]}>
            <View style={styles.workEntryIcon}>
              <ThemedText style={styles.workEntryEmoji}>🧾</ThemedText>
            </View>
            <View style={styles.workEntryCopy}>
              <ThemedText style={[styles.workEntryTitle, { color: accent }]}>零工委托</ThemedText>
              <ThemedText style={[styles.workEntryText, { color: mutedText }]}>花一点游戏时间，赚些采购用的金币。</ThemedText>
            </View>
            <ThemedText style={[styles.workEntryAction, { color: accent }]}>去看看</ThemedText>
          </Pressable>

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
                onOpenShop={() => openShop(location)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
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
  onOpenShop: () => void;
};

function LocationCard({ location, isCurrent, player, accent, cardBorder, mutedText, onPress, onOpenShop }: LocationCardProps) {
  const open = isLocationOpen(location, player.gameTime);
  const hoursLabel = formatOpenHours(location.openHours);
  const visibleNpcs = getNpcsAtLocation(location.id, player.gameTime, mainNpcs, mainNpcSchedules, mainLocations);
  const visibleNpcNames = visibleNpcs.map((npc) => npc.name).join('、');
  const hasShop = Boolean(location.shopId);

  return (
    <View
      style={[
        styles.nodeCard,
        {
          borderColor: isCurrent ? accent : cardBorder,
          backgroundColor: isCurrent ? 'rgba(209,187,222,0.12)' : 'rgba(255,255,255,0.14)',
        },
      ]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.nodeBtn, { opacity: pressed ? 0.94 : 1 }]}>
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
            <ThemedText style={[styles.nodeStatusText, { color: open ? accent : mutedText }]}>{open ? '营业中' : '尚未营业'}</ThemedText>
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

      {hasShop ? (
        <View style={styles.shopEntrySection}>
          <ThemedText style={[styles.shopHint, { color: mutedText }]}>货架上摆着适合见习魔女的小物。</ThemedText>
          <Pressable
            onPress={onOpenShop}
            style={({ pressed }) => [
              styles.shopEntryButton,
              {
                borderColor: accent,
                backgroundColor: pressed ? 'rgba(209,187,222,0.2)' : 'rgba(209,187,222,0.12)',
              },
            ]}>
            <ThemedText style={[styles.shopEntryText, { color: accent }]}>进入采购</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function isLocationUnlocked(location: GameLocation, player: PlayerState): boolean {
  if (!location.unlockRequirements || location.unlockRequirements.length === 0) return true;
  return location.unlockRequirements.every((condition) => evaluateCondition(condition, player));
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34 },
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
  workEntry: { borderWidth: 1.5, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  workEntryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.26)' },
  workEntryEmoji: { fontSize: 24, lineHeight: 28 },
  workEntryCopy: { flex: 1, minWidth: 0, gap: 3 },
  workEntryTitle: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  workEntryText: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  workEntryAction: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nodeCard: {
    width: '48%',
    minHeight: 138,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  nodeBtn: {
    flexGrow: 1,
    paddingVertical: 12,
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
  shopEntrySection: { gap: 6, paddingTop: 2 },
  shopHint: { fontSize: 10, lineHeight: 13, fontWeight: '800' },
  shopEntryButton: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  shopEntryText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
});
