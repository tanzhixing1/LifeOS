import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  LILITH_REALITY_CHAT_EVENT_ID,
  LILITH_TALK_EVENT_IDS,
  lilithNoRecentRealityLogText,
  mainContentPack,
  mainLocations,
  mainNpcLocationEncounters,
  mainNpcRealityReactionRules,
  mainNpcs,
  mainNpcSchedules,
} from '@/features/game/content/main';
import { executeChoice, getAvailableChoices } from '@/features/game/engine/executor';
import { getNpcEncountersAtLocation } from '@/features/game/engine/npc';
import { createNpcRealityReaction } from '@/features/game/engine/npcReactions';
import { formatGameTime } from '@/features/game/engine/time';
import type { Choice, EventNode } from '@/features/game/engine/types';
import { validateContentPack } from '@/features/game/engine/validate';
import { EventRenderer } from '@/features/game/ui/EventRenderer';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

type PlayRouteParams = {
  mode?: string | string[];
  eventId?: string | string[];
  locationId?: string | string[];
};

type PlayMode = 'start' | 'continue' | 'event';

const HOME_LOCATION_ID = 'home';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string' && value.length > 0) return value;
  return undefined;
}

function resolveEventId(eventId: string | undefined, eventsById: Map<string, EventNode>, fallbackEventId: string): string {
  if (eventId && eventsById.has(eventId)) return eventId;
  return fallbackEventId;
}

function resolveLocationId(locationId: string | undefined, fallbackLocationId: string): string {
  if (typeof locationId === 'string' && locationId.length > 0) return locationId;
  return fallbackLocationId;
}

export default function GamePlayScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');

  const params = useLocalSearchParams<PlayRouteParams>();
  const routeMode = firstParam(params.mode);
  const explicitEventId = firstParam(params.eventId);
  const explicitLocationId = firstParam(params.locationId);

  const pack = mainContentPack;
  const validation = useMemo(() => validateContentPack(pack), [pack]);
  const eventsById = useMemo(() => new Map<string, EventNode>(pack.events.map((event) => [event.id, event])), [pack.events]);
  const locationNameById = useMemo(() => new Map(mainLocations.map((location) => [location.id, location.name])), []);

  const player = useGameStore((s) => s.player);
  const rewardLogs = useGameStore((s) => s.rewardLogs);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const setLocation = useGameStore((s) => s.setLocation);
  const gotoEvent = useGameStore((s) => s.gotoEvent);
  const markResumePlay = useGameStore((s) => s.markResumePlay);
  const markResumeMap = useGameStore((s) => s.markResumeMap);

  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState(player.location ?? HOME_LOCATION_ID);
  const [isResolvingInitialEvent, setIsResolvingInitialEvent] = useState(true);
  const [hasResolvedInitialEvent, setHasResolvedInitialEvent] = useState(false);

  const playMode = useMemo<PlayMode>(() => {
    if (routeMode === 'start') return 'start';
    if (routeMode === 'continue') return 'continue';
    if (routeMode === 'event') return 'event';
    return explicitEventId ? 'event' : 'continue';
  }, [explicitEventId, routeMode]);

  const initializationKey = `${playMode}:${explicitEventId ?? ''}:${explicitLocationId ?? ''}`;

  useEffect(() => {
    const store = useGameStore.getState();
    const storedEventId = store.eventId;
    const storedLocationId = store.player.location ?? HOME_LOCATION_ID;

    let nextEventId = pack.startEventId;
    let nextLocationId = storedLocationId;

    setIsResolvingInitialEvent(true);
    setHasResolvedInitialEvent(false);

    if (playMode === 'start') {
      nextEventId = pack.startEventId;
      nextLocationId = HOME_LOCATION_ID;
      setLocation(nextLocationId);
      gotoEvent(nextEventId);
    } else if (playMode === 'event') {
      nextEventId = resolveEventId(explicitEventId, eventsById, pack.startEventId);
      nextLocationId = resolveLocationId(explicitLocationId, storedLocationId);
      if (storedEventId !== nextEventId) {
        gotoEvent(nextEventId);
      }
      if (storedLocationId !== nextLocationId) {
        setLocation(nextLocationId);
      }
    } else {
      nextEventId = resolveEventId(explicitEventId ?? storedEventId, eventsById, pack.startEventId);
      nextLocationId = resolveLocationId(explicitLocationId, storedLocationId);
      if (storedEventId !== nextEventId) {
        gotoEvent(nextEventId);
      }
      if (explicitLocationId && storedLocationId !== nextLocationId) {
        setLocation(nextLocationId);
      }
    }

    nextEventId = resolveEventId(nextEventId, eventsById, pack.startEventId);
    setActiveEventId(nextEventId);
    setActiveLocationId(nextLocationId);
    setHasResolvedInitialEvent(true);
    setIsResolvingInitialEvent(false);
  }, [eventsById, explicitEventId, explicitLocationId, gotoEvent, initializationKey, pack.startEventId, playMode, setLocation]);

  useEffect(() => {
    if (!hasResolvedInitialEvent || !activeEventId) return;
    markResumePlay(activeEventId, activeLocationId);
  }, [activeEventId, activeLocationId, hasResolvedInitialEvent, markResumePlay]);

  const event = (activeEventId ? eventsById.get(activeEventId) : undefined) ?? eventsById.get(pack.startEventId);
  const currentLocation = useMemo(
    () => mainLocations.find((location) => location.id === activeLocationId),
    [activeLocationId]
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
      mainNpcs,
      mainNpcSchedules,
      mainNpcLocationEncounters,
      mainLocations
    )
      .filter((encounter) => eventsById.has(encounter.talkEventId))
      .map<Choice>((encounter) => ({
        text: encounter.choiceText ?? `和 ${encounter.npc.name} 说话`,
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
      rules: mainNpcRealityReactionRules,
      noRecentLogText: lilithNoRecentRealityLogText,
    });

    return {
      ...event,
      paragraphs: ['莉莉丝抬了抬眼，像是从很远的地方听见了现实世界的回声。', reaction.text],
    };
  }, [event, rewardLogs]);

  const locationLabel = locationNameById.get(activeLocationId) ?? '未知地点';

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.replace('/(tabs)/game')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
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
      ) : isResolvingInitialEvent || !hasResolvedInitialEvent || !displayEvent || !activeEventId ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.errorText, { color: mutedText }]}>正在载入当前事件...</ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <View style={[styles.locationRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.locationText, { color: mutedText }]}>当前位置：{locationLabel}</ThemedText>
          </View>

          <EventRenderer
            event={displayEvent}
            choices={choices}
            onSelectChoice={(choice) => {
              const result = executeChoice(choice, player);
              const nextLocationId = result.nextLocationId ?? result.player.location ?? activeLocationId;
              const nextEventId = result.nextEventId ? resolveEventId(result.nextEventId, eventsById, pack.startEventId) : undefined;

              setPlayer(result.player);

              if (nextLocationId !== activeLocationId) {
                setActiveLocationId(nextLocationId);
              }

              if (result.nextLocationId) {
                setLocation(result.nextLocationId);
              }

              if (result.nextRoute === 'map') {
                markResumeMap(nextLocationId);
                router.replace('/(tabs)/game/map');
                return;
              }

              if (nextEventId) {
                if (result.nextEventId !== nextEventId) {
                  console.warn(`[game] Missing event "${result.nextEventId}", fallback to "${nextEventId}".`);
                }
                setActiveEventId(nextEventId);
                gotoEvent(nextEventId);
                markResumePlay(nextEventId, nextLocationId);
                return;
              }

              if (result.nextLocationId) {
                markResumePlay(activeEventId, nextLocationId);
                return;
              }

              console.warn(`[game] Choice has no navigation target in event "${activeEventId}": "${choice.text}"`);
            }}
          />
        </ScrollView>
      )}
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
