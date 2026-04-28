import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { selectHabitCards, useHabitStore, useTodoStore } from '@/stores';
import { useMessengerStore } from '@/stores/messengerStore';

export default function ToolsHomeScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = tabBarHeight + insets.bottom + 40;

  const habitsMap = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const habits = useMemo(() => selectHabitCards({ habits: habitsMap, logs } as any), [habitsMap, logs]);

  const todoItems = useTodoStore((s) => s.items);
  const toggleTodo = useTodoStore((s) => s.toggle);

  const trigger = useMessengerStore((s) => s.trigger);
  const [quickOpen, setQuickOpen] = useState(false);

  const todayText = useMemo(() => {
    const d = new Date();
    const date = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const weekday = d.toLocaleDateString('zh-CN', { weekday: 'long' });
    return `${date} · ${weekday}`;
  }, []);

  const habitStats = useMemo(() => {
    const done = habits.filter((h) => h.doneToday).length;
    const total = habits.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, percent };
  }, [habits]);

  const topTodos = useMemo(() => todoItems.filter((t) => !t.done).slice(0, 5), [todoItems]);

  useEffect(() => {
    const now = Date.now();
    const soon = todoItems.find((t: any) => !t.done && typeof t.dueAt === 'number' && t.dueAt - now > 0 && t.dueAt - now <= 60 * 60 * 1000);
    if (soon) {
      trigger({
        type: 'todo_due_soon',
        key: `todo_due_soon.${soon.id}`,
        title: '快到期了，别装死',
        body: `「${soon.title}」快到截止时间了。你要是不动，我就当你主动放弃了。`,
      });
    }

    const hour = new Date().getHours();
    if (hour >= 20 && habitStats.done === 0) {
      trigger({
        type: 'habit_stagnant',
        key: `habit_stagnant.${new Date().toDateString()}`,
        title: '能量停滞警报',
        body: '今天的打卡进度一动不动。你是打算用意念完成吗？',
      });
    }
  }, [todoItems, habitStats.done, trigger]);

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.bigTitle}>工具（高效但别太认真）</ThemedText>
      </View>

      <View style={styles.quickBar}>
        <Pressable
          onPress={() => setQuickOpen((v) => !v)}
          style={({ pressed }) => [
            styles.quickChip,
            { backgroundColor: accent, opacity: pressed ? 0.92 : 1 },
          ]}>
          <ThemedText style={styles.quickChipText}>{quickOpen ? '收起快速新增' : '快速新增（别磨蹭）'}</ThemedText>
        </Pressable>
        {quickOpen ? (
          <View style={[styles.quickPanel, { borderColor: cardBorder, backgroundColor: cardBg }]}>
            <Pressable
              onPress={() => {
                setQuickOpen(false);
                router.push('/(tabs)/tools/todos?create=1');
              }}
              style={({ pressed }) => [styles.quickEntry, { borderColor: cardBorder, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={[styles.quickEntryText, { color: mutedText }]}>新增待办</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                setQuickOpen(false);
                router.push('/(tabs)/tools/habits?create=1');
              }}
              style={({ pressed }) => [styles.quickEntry, { borderColor: cardBorder, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={[styles.quickEntryText, { color: mutedText }]}>新增习惯</ThemedText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.helloTop}>
            <ThemedText style={styles.cardTitle}>Hello World（别装作很忙）</ThemedText>
            <ThemedText style={[styles.muted, { color: mutedText }]}>{todayText}</ThemedText>
          </View>
          <View style={styles.helloRow}>
            <ThemedText style={[styles.muted, { color: mutedText }]}>天气：--</ThemedText>
            <ThemedText style={[styles.muted, { color: mutedText }]}>“让我歇会吧~（你先动手）”</ThemedText>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/tools/habits')}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
          ]}>
          <View style={styles.cardTopRow}>
            <ThemedText style={styles.cardTitle}>魔女能量</ThemedText>
            <ThemedText style={[styles.muted, { color: mutedText }]}>
              {habitStats.done}/{habitStats.total}
            </ThemedText>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
            <View style={[styles.progressFill, { backgroundColor: accent, width: `${habitStats.percent}%` }]} />
          </View>
          <ThemedText style={[styles.muted, { color: mutedText }]}>今日打卡 {habitStats.percent}%</ThemedText>

          <View style={styles.cardActionsRow}>
            <Pressable
              onPress={() => router.push('/(tabs)/tools/habits?create=1')}
              style={({ pressed }) => [
                styles.smallChip,
                { borderColor: accent, opacity: pressed ? 0.9 : 1 },
              ]}>
              <ThemedText style={[styles.smallChipText, { color: accent }]}>去新建（快点）</ThemedText>
            </Pressable>
          </View>
        </Pressable>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Pressable onPress={() => router.push('/(tabs)/tools/todos')} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <View style={styles.cardTopRow}>
              <ThemedText style={styles.cardTitle}>魔女事务</ThemedText>
              <ThemedText style={[styles.muted, { color: mutedText }]}>今日重点 3–5</ThemedText>
            </View>
          </Pressable>

          <View style={styles.todoList}>
            {topTodos.length === 0 ? (
              <ThemedText style={[styles.muted, { color: mutedText }]}>今天很清爽。你最好不是在逃避。</ThemedText>
            ) : (
              topTodos.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => toggleTodo(t.id)}
                  style={({ pressed }) => [
                    styles.todoRow,
                    { borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
                  ]}>
                  <View style={[styles.todoDot, { borderColor: cardBorder }]} />
                  <View style={styles.todoText}>
                    <ThemedText style={styles.todoTitle}>{t.title}</ThemedText>
                    <ThemedText style={[styles.muted, { color: mutedText }]}>
                      {(t as any).dueAt ? new Date((t as any).dueAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '无截止'}
                    </ThemedText>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.cardActionsRow}>
            <Pressable
              onPress={() => router.push('/(tabs)/tools/todos?create=1')}
              style={({ pressed }) => [
                styles.smallChip,
                { borderColor: accent, opacity: pressed ? 0.9 : 1 },
              ]}>
              <ThemedText style={[styles.smallChipText, { color: accent }]}>去新建（快点）</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.cardTitle}>语境通知官（能吵就吵）</ThemedText>
          <ThemedText style={[styles.muted, { color: mutedText }]}>
            我会在你拖延、到期、完成时冒出来说两句。现在先看得到弹窗，不接 AI。
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 10, gap: 8 },
  bigTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  quickBar: { gap: 10, paddingTop: 2, paddingBottom: 6 },
  quickChip: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  quickChipText: { color: '#1D1B1E', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  quickPanel: { borderWidth: 1, borderRadius: 18, padding: 10, flexDirection: 'row', gap: 10 },
  quickEntry: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  quickEntryText: { fontSize: 14, lineHeight: 18, fontWeight: '900' },

  scrollContent: { paddingTop: 6, paddingBottom: 18, gap: 12 },

  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  muted: { fontSize: 13, lineHeight: 18, fontWeight: '700' },

  helloTop: { gap: 4 },
  helloRow: { flexDirection: 'row', justifyContent: 'space-between' },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 999 },

  todoList: { gap: 10 },
  todoRow: { borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  todoDot: { width: 14, height: 14, borderRadius: 6, borderWidth: 2 },
  todoText: { flex: 1, gap: 2 },
  todoTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900' },

  cardActionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  smallChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  smallChipText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
});
