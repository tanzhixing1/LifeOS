import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type Todo, useTodoStore } from '@/stores';

export default function ToolsScheduleScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const accent = theme === 'light' ? '#6D8AAE' : '#88A9D4';
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listBottomPadding = tabBarHeight + insets.bottom + uiTokens.layout.tabBarExtraPadding;

  const items = useTodoStore((s) => s.items) as Pick<Todo, 'id' | 'title' | 'due' | 'tags' | 'done'>[];
  const toggleStore = useTodoStore((s) => s.toggle);
  const addTodo = useTodoStore((s) => s.addTodo);

  const stats = useMemo(() => {
    const done = items.filter((x) => x.done).length;
    return { done, total: items.length };
  }, [items]);

  function toggle(id: string) {
    toggleStore(id);
  }

  function addSchedule() {
    addTodo();
  }

  return (
    <ScreenScaffold>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <ThemedText style={[styles.kicker, { color: accent }]}>SCHEDULE NOTE</ThemedText>
          <ThemedText style={styles.bigTitle}>日程记事</ThemedText>
        </View>
        <View style={[styles.summaryStrip, { borderColor: palette.border, backgroundColor: palette.input }]}>
          <ThemedText style={[styles.hint, { color: palette.muted }]}>今日完成：{stats.done}/{stats.total}</ThemedText>
          <AppChip title="+ 新建" onPress={addSchedule} style={styles.addChip} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: uiTokens.spacing.sm }} />}
        ListEmptyComponent={
          <SectionCard style={[styles.emptyCard, { borderColor: palette.border, backgroundColor: palette.input }]}>
            <ThemedText style={[styles.emptyMark, { color: accent }]}>□</ThemedText>
            <ThemedText style={[styles.emptyText, { color: palette.muted }]}>暂时没有日程。需要时再加，不用把一天塞满。</ThemedText>
          </SectionCard>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggle(item.id)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: palette.cardAlt, borderColor: item.done ? accent : palette.border, opacity: pressed ? 0.92 : 1 },
            ]}>
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.done ? accent : 'transparent', borderColor: item.done ? accent : palette.border },
                ]}
              />
              <View style={styles.cardText}>
                <ThemedText style={[styles.cardTitle, item.done ? styles.doneTitle : undefined]}>{item.title}</ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: palette.muted }]}>
                  {item.due ?? '未设置'}
                  {item.tags && item.tags.length > 0 ? ` · ${item.tags.join(' / ')}` : ''}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.statusPill, { borderColor: item.done ? accent : palette.border }]}>
              <ThemedText style={[styles.status, { color: item.done ? accent : palette.muted }]}>
                {item.done ? '已完成' : '待办'}
              </ThemedText>
            </View>
          </Pressable>
        )}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, gap: uiTokens.spacing.md },
  titleWrap: { alignItems: 'center', gap: 2 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.1 },
  bigTitle: uiTokens.typography.pageTitle,
  summaryStrip: { borderWidth: 1, borderRadius: uiTokens.radius.md, paddingVertical: uiTokens.spacing.sm, paddingHorizontal: uiTokens.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  hint: { fontSize: 13, lineHeight: 16, fontWeight: '800' },
  addChip: { paddingVertical: 7 },
  listContent: { paddingTop: 2 },
  card: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    padding: uiTokens.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: uiTokens.spacing.md,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: uiTokens.spacing.md, flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 6, borderWidth: 2 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '900', lineHeight: 22 },
  doneTitle: { opacity: 0.62, textDecorationLine: 'line-through' },
  cardSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  statusPill: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 5 },
  status: { fontSize: 12, lineHeight: 14, fontWeight: '900' },
  emptyCard: { alignItems: 'center', marginTop: uiTokens.spacing.md },
  emptyMark: { fontSize: 24, lineHeight: 28, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
});
