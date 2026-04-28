import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getLocalISODate } from '@/core/utils/date';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';
import type { RewardLog } from '@/stores/gameStore';

const PAGE_SIZE = 10;
const RECENT_DAYS = 7;

type LogGroup = {
  dateISO: string;
  label: string;
  logs: RewardLog[];
};

export default function WitchLogScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const textColor = useThemeColor({ light: '#3D3A36', dark: '#E4E4E7' }, 'text');

  const rewardLogs = useGameStore((s) => s.rewardLogs);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const recentLogs = useMemo(() => {
    const recentDates = getRecentLocalDateISOSet();
    return rewardLogs
      .filter((log) => recentDates.has(getLocalISODate(new Date(log.createdAt))))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [rewardLogs]);

  const groups = useMemo(() => groupLogsByLocalDate(recentLogs.slice(0, visibleCount)), [recentLogs, visibleCount]);
  const hasMore = visibleCount < recentLogs.length;

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>魔女日志</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>最近七天的属性变化</ThemedText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {recentLogs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={styles.emptyTitle}>最近还没有属性变化</ThemedText>
            <ThemedText style={[styles.emptyText, { color: mutedText }]}>完成待办、习惯打卡，或推进游戏事件后，变化会记录在这里。</ThemedText>
          </View>
        ) : (
          <>
            {groups.map((group) => (
              <View key={group.dateISO} style={styles.group}>
                <ThemedText style={[styles.groupTitle, { color: mutedText }]}>{group.label}</ThemedText>
                <View style={styles.logList}>
                  {group.logs.map((log) => (
                    <View key={log.id} style={[styles.logCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                      <View style={styles.logTop}>
                        <View style={styles.logTitleBlock}>
                          <ThemedText style={[styles.logMeta, { color: mutedText }]}>
                            {formatLogTime(log.createdAt)} · {SOURCE_LABELS[log.source]}
                          </ThemedText>
                          <ThemedText style={styles.logTitle} numberOfLines={2}>
                            {log.title}
                          </ThemedText>
                        </View>
                        <View
                          style={[
                            styles.directionPill,
                            {
                              borderColor: log.direction === 'gain' ? accent : cardBorder,
                              backgroundColor: log.direction === 'gain' ? 'rgba(209,187,222,0.14)' : 'rgba(122,117,111,0.08)',
                            },
                          ]}>
                          <ThemedText style={[styles.directionText, { color: log.direction === 'gain' ? accent : mutedText }]}>{getDirectionLabel(log)}</ThemedText>
                        </View>
                      </View>

                      <View style={styles.logBottom}>
                        <View style={[styles.categoryPill, { borderColor: cardBorder }]}>
                          <ThemedText style={[styles.categoryText, { color: mutedText }]} numberOfLines={1}>
                            {log.category}
                          </ThemedText>
                        </View>
                        <View style={styles.deltaList}>
                          {formatDeltas(log).map((delta) => (
                            <View key={delta} style={[styles.deltaPill, { borderColor: cardBorder, backgroundColor: 'rgba(255,255,255,0.24)' }]}>
                              <ThemedText style={[styles.deltaText, { color: textColor }]}>{delta}</ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.footer}>
              {hasMore ? (
                <Pressable
                  onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  style={({ pressed }) => [
                    styles.moreButton,
                    { borderColor: accent, backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.12)' },
                  ]}>
                  <ThemedText style={[styles.moreText, { color: accent }]}>查看更多</ThemedText>
                </Pressable>
              ) : (
                <ThemedText style={[styles.endText, { color: mutedText }]}>已经到底了</ThemedText>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const SOURCE_LABELS: Record<RewardLog['source'], string> = {
  todo: '待办',
  habit: '习惯',
  game: '游戏事件',
};

const DIRECTION_LABELS: Record<RewardLog['direction'], string> = {
  gain: '获得',
  revert: '撤回',
};

const DELTA_LABELS: Record<string, string> = {
  mana: 'Mana',
  hp: 'HP',
  sanity: 'Sanity',
  stamina: 'Stamina',
  focus: 'Focus',
  charisma: 'Charisma',
  intelligence: 'Intelligence',
  proficiency: 'Proficiency',
  family: 'Family',
  friendship: 'Friendship',
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 40 },
  bigTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  content: { gap: 12, paddingBottom: 34 },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 6 },
  emptyTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  group: { gap: 8 },
  groupTitle: { fontSize: 12, lineHeight: 16, fontWeight: '900', paddingHorizontal: 2 },
  logList: { gap: 8 },
  logCard: { borderWidth: 1, borderRadius: 16, padding: 11, gap: 9 },
  logTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  logTitleBlock: { flex: 1, minWidth: 0, gap: 2 },
  logMeta: { fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: 0.4 },
  logTitle: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  directionPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  directionText: { fontSize: 11, lineHeight: 13, fontWeight: '900' },
  logBottom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  categoryPill: { maxWidth: 120, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
  deltaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  deltaPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  deltaText: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
  footer: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  moreButton: { minHeight: 38, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  endText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
});

function getRecentLocalDateISOSet(): Set<string> {
  const dates = new Set<string>();
  const cursor = new Date();
  for (let offset = 0; offset < RECENT_DAYS; offset += 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - offset);
    dates.add(getLocalISODate(d));
  }
  return dates;
}

function groupLogsByLocalDate(logs: RewardLog[]): LogGroup[] {
  const groups: LogGroup[] = [];
  const today = getLocalISODate();
  const yesterday = getRelativeLocalISODate(1);
  const beforeYesterday = getRelativeLocalISODate(2);

  for (const log of logs) {
    const dateISO = getLocalISODate(new Date(log.createdAt));
    let group = groups.find((item) => item.dateISO === dateISO);
    if (!group) {
      group = {
        dateISO,
        label: formatDateGroupLabel(dateISO, today, yesterday, beforeYesterday),
        logs: [],
      };
      groups.push(group);
    }
    group.logs.push(log);
  }

  return groups;
}

function getRelativeLocalISODate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return getLocalISODate(d);
}

function formatDateGroupLabel(dateISO: string, today: string, yesterday: string, beforeYesterday: string): string {
  if (dateISO === today) return '今天';
  if (dateISO === yesterday) return '昨天';
  if (dateISO === beforeYesterday) return '前天';

  const [, month, day] = dateISO.split('-').map(Number);
  return `${month}月${day}日`;
}

function formatLogTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDirectionLabel(log: RewardLog): string {
  if (log.source === 'game') return '变化';
  return DIRECTION_LABELS[log.direction];
}

function formatDeltas(log: RewardLog): string[] {
  const entries = Object.entries(log.deltas);
  if (entries.length === 0) return ['属性无实际变化'];

  return entries.map(([key, value]) => {
    const sign = value > 0 ? '+' : '';
    return `${DELTA_LABELS[key] ?? key} ${sign}${value}`;
  });
}
