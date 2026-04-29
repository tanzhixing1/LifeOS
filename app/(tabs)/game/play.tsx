import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { executeChoice, getAvailableChoices } from '@/features/game/engine/executor';
import type { ContentPack, EventNode } from '@/features/game/engine/types';
import { validateContentPack } from '@/features/game/engine/validate';
import demoPackJson from '@/features/game/content/demo/events.json';
import { EventRenderer } from '@/features/game/ui/EventRenderer';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

export default function GamePlayScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const pack = demoPackJson as ContentPack;
  const validation = useMemo(() => validateContentPack(pack), [pack]);
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((e) => [e.id, e])), [pack.events]);

  const player = useGameStore((s) => s.player);
  const eventId = useGameStore((s) => s.eventId);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const gotoEvent = useGameStore((s) => s.gotoEvent);
  const save = useGameStore((s) => s.save);
  const load = useGameStore((s) => s.load);

  const event = eventsById.get(eventId) ?? eventsById.get(pack.startEventId);
  const choices = useMemo(() => (event ? getAvailableChoices(event, player) : []), [event, player]);

  function confirmLoadSlot(slotId: string) {
    Alert.alert('读取存档？', '这会用存档覆盖当前游戏状态。', [
      { text: '取消', style: 'cancel' },
      { text: '读取', onPress: () => load(slotId) },
    ]);
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>事件</ThemedText>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {!validation.ok ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.cardTitle}>内容包校验失败</ThemedText>
          <ScrollView style={{ maxHeight: 260 }}>
            {validation.errors.map((e, i) => (
              <ThemedText key={`err.${i}`} style={[styles.errorText, { color: mutedText }]}>
                {e}
              </ThemedText>
            ))}
          </ScrollView>
        </View>
      ) : event ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <View style={[styles.metaRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.metaText, { color: mutedText }]}>
              地点：{player.location ?? '未设置'} · 状态：{Object.entries(player.attrs)
                .map(([k, v]) => `${k}:${v}`)
                .join('  ')}
            </ThemedText>
          </View>

          <EventRenderer
            event={event}
            choices={choices}
            onSelectChoice={(choice) => {
              const result = executeChoice(choice, player);
              setPlayer(result.player);
              if (result.nextEventId) gotoEvent(result.nextEventId);
            }}
          />

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={styles.cardTitle}>存档</ThemedText>
            <View style={styles.slotRow}>
              <Pressable
                onPress={() => save('slot1')}
                style={({ pressed }) => [styles.chip, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
                <ThemedText style={[styles.chipText, { color: accent }]}>保存 1</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => confirmLoadSlot('slot1')}
                style={({ pressed }) => [styles.chip, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
                <ThemedText style={[styles.chipText, { color: accent }]}>读取 1</ThemedText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  body: { gap: 12, paddingBottom: 18 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  chip: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  chipText: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  errorText: { fontSize: 12, lineHeight: 16, fontWeight: '700', paddingVertical: 2 },
  metaRow: { borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  metaText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  slotRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
