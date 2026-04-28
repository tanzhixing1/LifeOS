import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { selectHabitCards, useHabitStore, useTodoStore } from '@/stores';
import { useMessengerStore } from '@/stores/messengerStore';

export default function ToolsHomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const reportAccent = theme === 'light' ? '#6D8AAE' : '#88A9D4';
  const [quickOpen, setQuickOpen] = useState(false);

  const habitsMap = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const habits = useMemo(() => selectHabitCards({ habits: habitsMap, logs } as any), [habitsMap, logs]);

  const todoItems = useTodoStore((s) => s.items);
  const toggleTodo = useTodoStore((s) => s.toggle);
  const trigger = useMessengerStore((s) => s.trigger);

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

  const todoStats = useMemo(() => {
    const active = todoItems.filter((t) => !t.done).length;
    const done = todoItems.filter((t) => t.done).length;
    return { active, done, total: todoItems.length };
  }, [todoItems]);

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
    <ScreenScaffold scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.issueLine, { backgroundColor: palette.border }]} />
        <ThemedText style={[styles.kicker, { color: reportAccent }]}>LIFEOS DAILY BRIEFING</ThemedText>
        <ThemedText style={styles.bigTitle}>今日工具简报</ThemedText>
        <ThemedText style={[styles.subtitle, { color: palette.muted }]}>{todayText}</ThemedText>
      </View>

      <SectionCard elevated style={[styles.briefCard, { borderColor: reportAccent }]}>
        <View style={styles.briefTop}>
          <View>
            <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>TODAY / TASKBOOK</ThemedText>
            <ThemedText style={styles.briefTitle}>现实任务中枢</ThemedText>
          </View>
          <View style={[styles.briefBadge, { borderColor: reportAccent }]}>
            <ThemedText style={[styles.briefBadgeText, { color: reportAccent }]}>NO. {String(new Date().getDate()).padStart(2, '0')}</ThemedText>
          </View>
        </View>
        <View style={styles.statGrid}>
          <View style={[styles.statBox, { backgroundColor: palette.input, borderColor: palette.border }]}>
            <ThemedText style={styles.statValue}>{todoStats.active}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: palette.muted }]}>待办未完成</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: palette.input, borderColor: palette.border }]}>
            <ThemedText style={styles.statValue}>{habitStats.percent}%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: palette.muted }]}>今日打卡</ThemedText>
          </View>
        </View>
      </SectionCard>

      <SectionCard style={styles.quickPanel}>
        <View style={styles.sectionTop}>
          <View>
            <ThemedText style={styles.sectionTitle}>快速新增</ThemedText>
            <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>少一点启动成本，多一点完成概率。</ThemedText>
          </View>
          <AppChip title={quickOpen ? '收起' : '展开'} selected={quickOpen} onPress={() => setQuickOpen((v) => !v)} />
        </View>
        {quickOpen ? (
          <View style={styles.quickActions}>
            <AppButton title="新增待办" variant="outline" onPress={() => router.push('/(tabs)/tools/todos?create=1')} style={styles.quickAction} />
            <AppButton title="新增习惯" variant="outline" onPress={() => router.push('/(tabs)/tools/habits?create=1')} style={styles.quickAction} />
          </View>
        ) : null}
      </SectionCard>

      <Pressable onPress={() => router.push('/(tabs)/tools/habits')} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        <SectionCard elevated style={styles.sectionCard}>
          <View style={styles.sectionTop}>
            <View>
              <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>HABIT ENERGY</ThemedText>
              <ThemedText style={styles.sectionTitle}>魔女能量</ThemedText>
            </View>
            <ThemedText style={[styles.countText, { color: palette.muted }]}>
              {habitStats.done}/{habitStats.total}
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: palette.input }]}>
            <View style={[styles.progressFill, { backgroundColor: reportAccent, width: `${habitStats.percent}%` }]} />
          </View>
          <View style={styles.cardFooter}>
            <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>今日打卡完成 {habitStats.percent}%</ThemedText>
            <AppChip title="去新建" onPress={() => router.push('/(tabs)/tools/habits?create=1')} />
          </View>
        </SectionCard>
      </Pressable>

      <SectionCard elevated style={styles.sectionCard}>
        <Pressable onPress={() => router.push('/(tabs)/tools/todos')} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
          <View style={styles.sectionTop}>
            <View>
              <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>TASK QUEUE</ThemedText>
              <ThemedText style={styles.sectionTitle}>魔女事务</ThemedText>
            </View>
            <ThemedText style={[styles.countText, { color: palette.muted }]}>未完 {todoStats.active}</ThemedText>
          </View>
        </Pressable>

        <View style={styles.todoList}>
          {topTodos.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: palette.input, borderColor: palette.border }]}>
              <ThemedText style={[styles.emptyMark, { color: reportAccent }]}>◇</ThemedText>
              <ThemedText style={[styles.emptyText, { color: palette.muted }]}>今天很清爽。可以补一件真正重要的小事。</ThemedText>
            </View>
          ) : (
            topTodos.map((t, index) => (
              <Pressable
                key={t.id}
                onPress={() => toggleTodo(t.id)}
                style={({ pressed }) => [
                  styles.todoRow,
                  { borderColor: palette.border, backgroundColor: palette.input, opacity: pressed ? 0.92 : 1 },
                ]}>
                <ThemedText style={[styles.todoIndex, { color: reportAccent }]}>{String(index + 1).padStart(2, '0')}</ThemedText>
                <View style={styles.todoText}>
                  <ThemedText style={styles.todoTitle}>{t.title}</ThemedText>
                  <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>
                    {(t as any).dueAt ? new Date((t as any).dueAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '无截止'}
                  </ThemedText>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.cardFooter}>
          <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>已完成 {todoStats.done} / 总计 {todoStats.total}</ThemedText>
          <AppChip title="去新建" onPress={() => router.push('/(tabs)/tools/todos?create=1')} />
        </View>
      </SectionCard>

      <SectionCard style={styles.sectionCard}>
        <View style={styles.sectionTop}>
          <View>
            <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>CONTEXT MESSENGER</ThemedText>
            <ThemedText style={styles.sectionTitle}>语境通知官</ThemedText>
          </View>
          <ThemedText style={[styles.emptyMark, { color: reportAccent }]}>□</ThemedText>
        </View>
        <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>
          我会在你拖延、到期、完成时冒出来说两句。现在先看得到弹窗，不接 AI。
        </ThemedText>
      </SectionCard>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: { gap: uiTokens.spacing.md },
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.sm, gap: uiTokens.spacing.sm, alignItems: 'center' },
  issueLine: { width: 88, height: 1, opacity: 0.9 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.2, textAlign: 'center' },
  bigTitle: uiTokens.typography.screenTitle,
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  briefCard: { padding: 18, gap: uiTokens.spacing.md },
  briefTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: uiTokens.spacing.md },
  briefMeta: { fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: 1 },
  briefTitle: { fontSize: 22, lineHeight: 28, fontWeight: '900' },
  briefBadge: { borderWidth: 1.5, borderRadius: uiTokens.radius.md, paddingHorizontal: uiTokens.spacing.md, paddingVertical: uiTokens.spacing.sm },
  briefBadgeText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  statGrid: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  statBox: { flex: 1, borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, gap: 2 },
  statValue: { fontSize: 24, lineHeight: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  quickPanel: { gap: uiTokens.spacing.md },
  quickActions: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  quickAction: { flex: 1 },
  sectionCard: { gap: uiTokens.spacing.md },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: uiTokens.spacing.md },
  sectionTitle: uiTokens.typography.sectionTitle,
  sectionSub: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  countText: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: uiTokens.radius.pill, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: uiTokens.radius.pill },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  todoList: { gap: uiTokens.spacing.sm },
  todoRow: { borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, flexDirection: 'row', gap: uiTokens.spacing.md, alignItems: 'center' },
  todoIndex: { width: 24, fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 0.8 },
  todoText: { flex: 1, gap: 2 },
  todoTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900' },
  emptyBox: { borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, alignItems: 'center', gap: uiTokens.spacing.sm },
  emptyMark: { fontSize: 20, lineHeight: 24, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
});
