import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import demoPackJson from '@/features/game/content/demo/events.json';
import { demoLocations } from '@/features/game/content/demo/locations';
import { demoNpcLocationEncounters, demoNpcSchedules, demoNpcs } from '@/features/game/content/demo/npcs';
import {
  demoNpcRealityReactionRules,
  LILITH_REALITY_CHAT_EVENT_ID,
  LILITH_TALK_EVENT_IDS,
  lilithNoRecentRealityLogText,
} from '@/features/game/content/demo/npcReactions';
import { executeChoice, getAvailableChoices } from '@/features/game/engine/executor';
import { getNpcEncountersAtLocation } from '@/features/game/engine/npc';
import { createNpcRealityReaction } from '@/features/game/engine/npcReactions';
import { formatGameTime } from '@/features/game/engine/time';
import type { Choice, ContentPack, EventNode } from '@/features/game/engine/types';
import { validateContentPack } from '@/features/game/engine/validate';
import { EventRenderer } from '@/features/game/ui/EventRenderer';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

export default function GamePlayScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');

  const pack = demoPackJson as ContentPack;
  const validation = useMemo(() => validateContentPack(pack), [pack]);
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((event) => [event.id, event])), [pack.events]);
  const locationNameById = useMemo(() => new Map(demoLocations.map((location) => [location.id, location.name])), []);

  const player = useGameStore((s) => s.player);
  const eventId = useGameStore((s) => s.eventId);
  const rewardLogs = useGameStore((s) => s.rewardLogs);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const setLocation = useGameStore((s) => s.setLocation);
  const gotoEvent = useGameStore((s) => s.gotoEvent);

  const event = eventsById.get(eventId) ?? eventsById.get(pack.startEventId);
  const currentLocation = useMemo(
    () => demoLocations.find((location) => location.id === (player.location ?? 'home')),
    [player.location]
  );
  const choices = useMemo(() => {
    if (!event) return [];

    const nextChoices = [...getAvailableChoices(event, player)];
    if (!currentLocation || event.presentation === 'visualNovel' || event.id !== currentLocation.entryEventId) {
      if (
        event.id !== LILITH_REALITY_CHAT_EVENT_ID &&
        LILITH_TALK_EVENT_IDS.includes(event.id as (typeof LILITH_TALK_EVENT_IDS)[number]) &&
        eventsById.has(LILITH_REALITY_CHAT_EVENT_ID) &&
        !nextChoices.some((choice) => choice.next?.eventId === LILITH_REALITY_CHAT_EVENT_ID)
      ) {
        nextChoices.push({
          text: '聊聊近况',
          next: { eventId: LILITH_REALITY_CHAT_EVENT_ID },
        });
      }
      return nextChoices;
    }

    const npcChoices = getNpcEncountersAtLocation(
      currentLocation.id,
      player.gameTime,
      demoNpcs,
      demoNpcSchedules,
      demoNpcLocationEncounters,
      demoLocations
    )
      .filter((encounter) => eventsById.has(encounter.talkEventId))
      .map<Choice>((encounter) => ({
        text: encounter.choiceText ?? `和${encounter.npc.name}说话`,
        next: { eventId: encounter.talkEventId },
      }));

    nextChoices.push(...npcChoices);

    if (
      event.id !== LILITH_REALITY_CHAT_EVENT_ID &&
      LILITH_TALK_EVENT_IDS.includes(event.id as (typeof LILITH_TALK_EVENT_IDS)[number]) &&
      eventsById.has(LILITH_REALITY_CHAT_EVENT_ID) &&
      !nextChoices.some((choice) => choice.next?.eventId === LILITH_REALITY_CHAT_EVENT_ID)
    ) {
      nextChoices.push({
        text: '聊聊近况',
        next: { eventId: LILITH_REALITY_CHAT_EVENT_ID },
      });
    }

    return nextChoices;
  }, [currentLocation, event, eventsById, player]);
  const displayEvent = useMemo(() => {
    if (!event || event.id !== LILITH_REALITY_CHAT_EVENT_ID || event.presentation === 'visualNovel') {
      return event;
    }

    const reaction = createNpcRealityReaction({
      npcId: 'lilith',
      logs: rewardLogs,
      rules: demoNpcRealityReactionRules,
      noRecentLogText: lilithNoRecentRealityLogText,
    });

    return {
      ...event,
      paragraphs: [
        '莉莉丝歪了歪头，像是从很远的地方听见了现实的回声。',
        reaction.text,
      ],
    };
  }, [event, rewardLogs]);
  const locationLabel = locationNameById.get(player.location ?? 'home') ?? '未命名地点';

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

        <View style={[styles.statusBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>{formatGameTime(player.gameTime)}</ThemedText>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>疲劳 {player.vitals.fatigue}</ThemedText>
          <ThemedText style={[styles.statusText, { color: mutedText }]}>金钱 {player.wallet.money}G</ThemedText>
        </View>
      </View>

      {!validation.ok ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.cardTitle}>内容包校验失败</ThemedText>
          <ScrollView style={{ maxHeight: 260 }}>
            {validation.errors.map((error, index) => (
              <ThemedText key={`err.${index}`} style={[styles.errorText, { color: mutedText }]}>
                {error}
              </ThemedText>
            ))}
          </ScrollView>
        </View>
      ) : displayEvent ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <View style={[styles.locationRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.locationText, { color: mutedText }]}>当前位置：{locationLabel}</ThemedText>
          </View>

          <EventRenderer
            event={displayEvent}
            choices={choices}
            onSelectChoice={(choice) => {
              const result = executeChoice(choice, player);
              setPlayer(result.player);
              if (result.nextLocationId) {
                setLocation(result.nextLocationId);
              }
              if (result.nextRoute === 'map') {
                router.replace('/(tabs)/game/map');
                return;
              }
              if (result.nextEventId) gotoEvent(result.nextEventId);
            }}
          />
        </ScrollView>
      ) : null}
    </ThemedView>
  );
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
  body: { gap: 12, paddingBottom: 18 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  errorText: { fontSize: 12, lineHeight: 16, fontWeight: '700', paddingVertical: 2 },
  locationRow: { borderWidth: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  locationText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
});
