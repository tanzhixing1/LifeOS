import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mainContentPack } from '@/features/game/content/main';
import type { EventNode } from '@/features/game/engine/types';
import { formatGameTime } from '@/features/game/engine/time';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useWalletStore } from '@/stores/walletStore';

const HOME_LOCATION_ID = 'home';

export default function GameHomeScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const hudBg = useThemeColor({ light: '#F7F3EE', dark: '#0B0B0F' }, 'background');
  const hudBorder = useThemeColor({ light: '#D8D0C7', dark: '#27272A' }, 'text');
  const hudText = useThemeColor({ light: '#3D3A36', dark: '#E4E4E7' }, 'text');
  const hudMuted = useThemeColor({ light: '#7A756F', dark: '#A1A1AA' }, 'text');
  const hudAccent = useThemeColor({ light: '#6366F1', dark: '#6366F1' }, 'tint');

  const player = useGameStore((s) => s.player);
  const lastScreen = useGameStore((s) => s.lastScreen);
  const lastEventId = useGameStore((s) => s.lastEventId);
  const resumeTarget = useGameStore((s) => s.resumeTarget);
  const gold = useWalletStore((s) => s.currencies.gold);
  const mana = player.attrs.mana ?? 0;
  const hp = player.attrs.hp ?? 0;
  const sanity = player.attrs.sanity ?? 0;

  const eventsById = useMemo(() => new Map<string, EventNode>(mainContentPack.events.map((event) => [event.id, event])), []);

  function enterPrologue() {
    const store = useGameStore.getState();
    const startEventId = mainContentPack.startEventId;

    store.setLocation(HOME_LOCATION_ID);
    store.gotoEvent(startEventId);
    store.markResumePlay(startEventId, HOME_LOCATION_ID);
    router.replace(
      `/(tabs)/game/play?mode=start&eventId=${encodeURIComponent(startEventId)}&locationId=${encodeURIComponent(HOME_LOCATION_ID)}`
    );
  }

  function startNewJourney() {
    useGameStore.getState().resetGame();
    useWalletStore.getState().resetWallet();
    useInventoryStore.getState().resetInventory();
    enterPrologue();
  }

  function continueJourney() {
    const store = useGameStore.getState();

    if (resumeTarget.type === 'map' || lastScreen === 'map') {
      router.replace('/(tabs)/game/map');
      return;
    }

    const candidateEventIds = [
      resumeTarget.type === 'play' ? resumeTarget.eventId : undefined,
      lastEventId,
      store.eventId,
      mainContentPack.startEventId,
    ];
    const nextEventId = candidateEventIds.find((eventId) => Boolean(eventId) && eventsById.has(eventId as string));
    const nextLocationId =
      resumeTarget.type === 'play'
        ? resumeTarget.locationId ?? store.player.location ?? HOME_LOCATION_ID
        : store.player.location ?? HOME_LOCATION_ID;

    if (nextEventId) {
      router.replace(
        `/(tabs)/game/play?mode=continue&eventId=${encodeURIComponent(nextEventId)}&locationId=${encodeURIComponent(nextLocationId)}`
      );
      return;
    }

    enterPrologue();
  }

  function confirmResetGame() {
    Alert.alert('开始新旅程', '这会重置当前游戏进度和属性，但不会影响现实任务记录。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认开始',
        style: 'destructive',
        onPress: startNewJourney,
      },
    ]);
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.bigTitle}>魔女模拟器</ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>从小屋醒来，再走进雾莓镇。</ThemedText>
        </View>

        <View style={[styles.hud, { backgroundColor: hudBg, borderColor: hudBorder }]}>
          <View style={styles.hudHeader}>
            <ThemedText style={[styles.hudHeaderText, { color: hudMuted }]}>Witch Status</ThemedText>
          </View>
          <View style={styles.quickStatusRow}>
            <View style={[styles.quickStatusPill, { borderColor: hudBorder }]}>
              <ThemedText style={[styles.quickStatusText, { color: hudMuted }]}>{formatGameTime(player.gameTime)}</ThemedText>
            </View>
            <View style={[styles.quickStatusPill, { borderColor: hudBorder }]}>
              <ThemedText style={[styles.quickStatusText, { color: hudMuted }]}>疲劳 {player.vitals.fatigue}</ThemedText>
            </View>
            <View style={[styles.quickStatusPill, { borderColor: hudBorder }]}>
              <ThemedText style={[styles.quickStatusText, { color: hudMuted }]}>金币 {gold}G</ThemedText>
            </View>
          </View>
          <View style={styles.hudRow}>
            <View style={styles.hudItem}>
              <View style={styles.hudTop}>
                <ThemedText style={[styles.hudLabel, { color: hudMuted }]}>Mana</ThemedText>
                <ThemedText style={[styles.hudValue, { color: hudText }]}>{mana}</ThemedText>
              </View>
              <View style={[styles.hudBar, { backgroundColor: hudBorder }]}>
                <View style={[styles.hudBarFill, { backgroundColor: hudAccent, width: `${clampPct(mana)}%` }]} />
              </View>
            </View>

            <View style={styles.hudItem}>
              <View style={styles.hudTop}>
                <ThemedText style={[styles.hudLabel, { color: hudMuted }]}>HP</ThemedText>
                <ThemedText style={[styles.hudValue, { color: hudText }]}>{hp}</ThemedText>
              </View>
              <View style={[styles.hudBar, { backgroundColor: hudBorder }]}>
                <View style={[styles.hudBarFill, { backgroundColor: hudAccent, width: `${clampPct(hp)}%` }]} />
              </View>
            </View>

            <View style={styles.hudItem}>
              <View style={styles.hudTop}>
                <ThemedText style={[styles.hudLabel, { color: hudMuted }]}>Sanity</ThemedText>
                <ThemedText style={[styles.hudValue, { color: hudText }]}>{sanity}</ThemedText>
              </View>
              <View style={[styles.hudBar, { backgroundColor: hudBorder }]}>
                <View style={[styles.hudBarFill, { backgroundColor: hudAccent, width: `${clampPct(sanity)}%` }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.parchment, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.parchmentHint, { color: mutedText }]}>序章入口和继续旅程现在会按不同恢复规则进入游戏。</ThemedText>

          <Pressable onPress={enterPrologue} style={({ pressed }) => [styles.mapNode, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
            <ThemedText style={[styles.mapNodeText, { color: accent }]}>从序章开始</ThemedText>
            <ThemedText style={[styles.mapNodeSub, { color: mutedText }]}>强制进入 prologue_wake_up</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/game/shop')}
            style={({ pressed }) => [styles.shopNode, { borderColor: cardBorder, opacity: pressed ? 0.9 : 1 }]}>
            <ThemedText style={[styles.shopNodeText, { color: accent }]}>雾莓采购单</ThemedText>
            <ThemedText style={[styles.shopNodeSub, { color: mutedText }]}>采购日常小物，放进魔女背包</ThemedText>
          </Pressable>

          <View style={styles.primaryArea}>
            <Pressable onPress={continueJourney} style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={styles.primaryBtnText}>继续旅程</ThemedText>
            </Pressable>
            <Pressable onPress={confirmResetGame} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <ThemedText style={[styles.linkText, { color: mutedText }]}>开始新旅程</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 32 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  bigTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  hud: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 12 },
  hudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  hudHeaderText: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 0.8 },
  quickStatusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  quickStatusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  quickStatusText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  hudRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hudItem: { flexGrow: 1, flexBasis: 0, minWidth: 92, gap: 8 },
  hudTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  hudLabel: { fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 0.2 },
  hudValue: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  hudBar: { height: 8, borderRadius: 999 },
  hudBarFill: { height: 8, borderRadius: 999 },
  parchment: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 14 },
  parchmentHint: { fontSize: 12, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  mapNode: { borderWidth: 1.5, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 14, alignItems: 'center', gap: 6 },
  mapNodeText: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  mapNodeSub: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  shopNode: { borderWidth: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)' },
  shopNodeText: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  shopNodeSub: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  primaryArea: { paddingTop: 6, gap: 10 },
  primaryBtn: { borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, lineHeight: 20, fontWeight: '900' },
  linkText: { fontSize: 13, lineHeight: 16, fontWeight: '900', textAlign: 'center', textDecorationLine: 'underline' },
});

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
