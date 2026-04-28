import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { getLocalISODate } from '@/core/utils/date';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { selectHabitCards, useDailyTimelineStore, useHabitStore, useTodoStore, type DailyTimelineRecord } from '@/stores';
import { useMessengerStore } from '@/stores/messengerStore';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const CALENDAR_ROW_COUNT = 6;
const DAYS_PER_WEEK = 7;
const SOURCE_LABELS: Record<DailyTimelineRecord['source'], string> = {
  todo: '待办',
  habit: '习惯',
  schedule: '行程',
  manual: '手动',
};

type CalendarDay = {
  date: Date;
  dateISO: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  recordCount: number;
};

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDateToMonth(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, Math.min(day, getDaysInMonth(year, monthIndex)));
}

function getTimelineTime(record: DailyTimelineRecord): number {
  return record.occurredAt ?? record.createdAt;
}

function formatTimelineTime(record: DailyTimelineRecord): string {
  return new Date(getTimelineTime(record)).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function buildCalendarDays(visibleMonth: Date, selectedDateISO: string, todayISO: string, recordCountsByDate: Map<string, number>): CalendarDay[] {
  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const gridStart = new Date(year, monthIndex, 1 - firstDay.getDay());

  return Array.from({ length: CALENDAR_ROW_COUNT * DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateISO = getLocalISODate(date);

    return {
      date,
      dateISO,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getFullYear() === year && date.getMonth() === monthIndex,
      isToday: dateISO === todayISO,
      isSelected: dateISO === selectedDateISO,
      recordCount: recordCountsByDate.get(dateISO) ?? 0,
    };
  });
}

export default function ToolsHomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const reportAccent = theme === 'light' ? '#6D8AAE' : '#88A9D4';
  const [quickOpen, setQuickOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(getDateOnly(new Date())));
  const [selectedDate, setSelectedDate] = useState(() => getDateOnly(new Date()));
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

  const habitsMap = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const habits = useMemo(() => selectHabitCards({ habits: habitsMap, logs } as any), [habitsMap, logs]);

  const todoItems = useTodoStore((s) => s.items);
  const toggleTodo = useTodoStore((s) => s.toggle);
  const trigger = useMessengerStore((s) => s.trigger);
  const dailyTimelineRecords = useDailyTimelineStore((s) => s.records);

  const todayISO = useMemo(() => getLocalISODate(new Date()), []);
  const selectedDateISO = useMemo(() => getLocalISODate(selectedDate), [selectedDate]);

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

  const dailyRecordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of dailyTimelineRecords) {
      if (record.deletedAt != null) continue;
      counts.set(record.dateISO, (counts.get(record.dateISO) ?? 0) + 1);
    }
    return counts;
  }, [dailyTimelineRecords]);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, selectedDateISO, todayISO, dailyRecordCounts),
    [dailyRecordCounts, selectedDateISO, todayISO, visibleMonth]
  );

  const selectedTimelineRecords = useMemo(
    () =>
      dailyTimelineRecords
        .filter((record) => record.dateISO === selectedDateISO && record.deletedAt == null)
        .sort((a, b) => getTimelineTime(a) - getTimelineTime(b) || a.createdAt - b.createdAt),
    [dailyTimelineRecords, selectedDateISO]
  );

  const selectedRecordCount = selectedTimelineRecords.length;

  const selectedDateLabel = useMemo(
    () => selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
    [selectedDate]
  );

  const calendarHintText = useMemo(() => {
    if (!isTimelineExpanded) {
      return selectedRecordCount > 0 ? `这天有 ${selectedRecordCount} 条记录，点击日期展开` : '这天还没有记录，点击日期展开';
    }
    return selectedRecordCount > 0 ? `这天有 ${selectedRecordCount} 条生活记录` : '这天还没有记录';
  }, [isTimelineExpanded, selectedRecordCount]);

  const shiftVisibleMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
      setSelectedDate((currentSelectedDate) =>
        clampDateToMonth(nextMonth.getFullYear(), nextMonth.getMonth(), currentSelectedDate.getDate())
      );
      return nextMonth;
    });
  };

  const selectCalendarDay = (day: CalendarDay) => {
    if (day.dateISO === selectedDateISO) {
      setIsTimelineExpanded((expanded) => !expanded);
      return;
    }

    setSelectedDate(day.date);
    setIsTimelineExpanded(true);
    if (!day.isCurrentMonth) {
      setVisibleMonth(getMonthStart(day.date));
    }
  };

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

      <SectionCard elevated style={[styles.calendarCard, { borderColor: palette.accent }]}>
        <View style={styles.calendarTop}>
          <View style={styles.calendarTitleBlock}>
            <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>DAILY TIMELINE</ThemedText>
            <ThemedText style={styles.calendarTitle}>
              {visibleMonth.getFullYear()}年 {visibleMonth.getMonth() + 1}月
            </ThemedText>
          </View>
          <View style={styles.monthControls}>
            <Pressable
              accessibilityLabel="上个月"
              onPress={() => shiftVisibleMonth(-1)}
              style={({ pressed }) => [
                styles.monthButton,
                { borderColor: palette.border, backgroundColor: palette.input, opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText style={[styles.monthButtonText, { color: palette.accentStrong }]}>‹</ThemedText>
            </Pressable>
            <Pressable
              accessibilityLabel="下个月"
              onPress={() => shiftVisibleMonth(1)}
              style={({ pressed }) => [
                styles.monthButton,
                { borderColor: palette.border, backgroundColor: palette.input, opacity: pressed ? 0.75 : 1 },
              ]}>
              <ThemedText style={[styles.monthButtonText, { color: palette.accentStrong }]}>›</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.calendarBindingRow}>
          <View style={[styles.calendarBindingDot, { backgroundColor: palette.accent }]} />
          <View style={[styles.calendarBindingLine, { backgroundColor: palette.border }]} />
          <View style={[styles.calendarBindingDot, { backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <ThemedText key={label} style={[styles.weekdayText, { color: palette.muted }]}>
              {label}
            </ThemedText>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {Array.from({ length: CALENDAR_ROW_COUNT }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.calendarWeekRow}>
              {calendarDays.slice(rowIndex * DAYS_PER_WEEK, rowIndex * DAYS_PER_WEEK + DAYS_PER_WEEK).map((day) => {
                const dayTextColor = day.isSelected
                  ? palette.accentStrong
                  : day.isToday
                    ? reportAccent
                    : day.isCurrentMonth
                      ? palette.text
                      : palette.muted;

                return (
                  <Pressable
                    key={day.dateISO}
                    onPress={() => selectCalendarDay(day)}
                    style={({ pressed }) => [styles.calendarDayCell, { opacity: pressed ? 0.75 : 1 }]}>
                    <View
                      style={[
                        styles.calendarDayCircle,
                        {
                          backgroundColor: day.isSelected ? palette.accentSoft : day.isToday ? palette.input : 'transparent',
                          borderColor: day.isSelected ? palette.accentStrong : day.isToday ? reportAccent : 'transparent',
                          opacity: day.isCurrentMonth ? 1 : 0.38,
                          transform: [{ rotate: day.isSelected ? '-2deg' : '0deg' }],
                        },
                      ]}>
                      <ThemedText style={[styles.calendarDayText, { color: dayTextColor }]}>{day.dayNumber}</ThemedText>
                      <View style={styles.recordDotSlot}>
                        {day.recordCount > 0 ? <View style={[styles.recordDot, { backgroundColor: palette.accentStrong }]} /> : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={[styles.calendarHint, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
          <ThemedText style={[styles.calendarHintDate, { color: palette.accentStrong }]}>{selectedDateLabel}</ThemedText>
          <ThemedText style={[styles.calendarHintText, { color: palette.muted }]}>{calendarHintText}</ThemedText>
        </View>
      </SectionCard>

      {isTimelineExpanded ? (
        <SectionCard elevated style={styles.timelineCard}>
          <View style={styles.sectionTop}>
            <View>
              <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>SELECTED DAY</ThemedText>
              <ThemedText style={styles.sectionTitle}>生活时间线</ThemedText>
            </View>
            <ThemedText style={[styles.countText, { color: palette.muted }]}>{selectedRecordCount} 条</ThemedText>
          </View>

          {selectedTimelineRecords.length === 0 ? (
            <View style={[styles.timelineEmpty, { backgroundColor: palette.input, borderColor: palette.border }]}>
              <ThemedText style={[styles.emptyMark, { color: palette.accentStrong }]}>◇</ThemedText>
              <View style={styles.timelineEmptyText}>
                <ThemedText style={styles.timelineEmptyTitle}>这天还没有记录</ThemedText>
                <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>完成待办或习惯打卡后，会自动留在这里。</ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.timelineList}>
              <View style={[styles.timelineRail, { backgroundColor: palette.accentSoft }]} />
              {selectedTimelineRecords.map((record) => (
                <View key={record.id} style={styles.timelineItem}>
                  <View style={[styles.timelineNode, { backgroundColor: palette.card, borderColor: palette.accentStrong }]} />
                  <View style={[styles.timelineRecordCard, { backgroundColor: palette.input, borderColor: palette.border }]}>
                    <View style={styles.timelineRecordTop}>
                      <ThemedText style={[styles.timelineTime, { color: palette.accentStrong }]}>{formatTimelineTime(record)}</ThemedText>
                      <View style={styles.timelineTags}>
                        {record.category ? (
                          <View style={[styles.timelineTag, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
                            <ThemedText style={[styles.timelineTagText, { color: palette.accentStrong }]}>{record.category}</ThemedText>
                          </View>
                        ) : null}
                        <View style={[styles.timelineTag, { backgroundColor: palette.cardAlt, borderColor: palette.border }]}>
                          <ThemedText style={[styles.timelineTagText, { color: palette.muted }]}>{SOURCE_LABELS[record.source]}</ThemedText>
                        </View>
                      </View>
                    </View>
                    <ThemedText style={styles.timelineTitle}>{record.title}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      ) : null}

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
  briefMeta: { fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: 1 },
  calendarCard: { padding: 16, gap: uiTokens.spacing.md },
  calendarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: uiTokens.spacing.md },
  calendarTitleBlock: { gap: 2 },
  calendarTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900' },
  monthControls: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  monthButton: { width: 36, height: 36, borderRadius: uiTokens.radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthButtonText: { fontSize: 25, lineHeight: 28, fontWeight: '900' },
  calendarBindingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: uiTokens.spacing.sm, marginTop: -2 },
  calendarBindingDot: { width: 7, height: 7, borderRadius: uiTokens.radius.pill },
  calendarBindingLine: { width: 92, height: 1 },
  weekdayRow: { flexDirection: 'row', alignItems: 'center' },
  weekdayText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '900', textAlign: 'center' },
  calendarGrid: { gap: 2 },
  calendarWeekRow: { flexDirection: 'row', alignItems: 'center' },
  calendarDayCell: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  calendarDayCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  calendarDayText: { fontSize: 17, lineHeight: 20, fontWeight: '900' },
  recordDotSlot: { height: 7, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  recordDot: { width: 5, height: 5, borderRadius: uiTokens.radius.pill },
  calendarHint: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.md,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: uiTokens.spacing.md,
  },
  calendarHintDate: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  calendarHintText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'right' },
  timelineCard: { gap: uiTokens.spacing.md },
  timelineEmpty: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.md,
    padding: uiTokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: uiTokens.spacing.md,
  },
  timelineEmptyText: { flex: 1, gap: 2 },
  timelineEmptyTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900' },
  timelineList: { gap: uiTokens.spacing.sm, position: 'relative', paddingLeft: 16 },
  timelineRail: { position: 'absolute', left: 21, top: 14, bottom: 14, width: 2, borderRadius: uiTokens.radius.pill },
  timelineItem: { flexDirection: 'row', gap: uiTokens.spacing.md, alignItems: 'flex-start' },
  timelineNode: { width: 12, height: 12, borderRadius: uiTokens.radius.pill, borderWidth: 2, marginTop: 16, zIndex: 1 },
  timelineRecordCard: { flex: 1, borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, gap: uiTokens.spacing.sm },
  timelineRecordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: uiTokens.spacing.sm, flexWrap: 'wrap' },
  timelineTime: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  timelineTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: uiTokens.spacing.xs },
  timelineTag: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 3 },
  timelineTagText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  timelineTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900' },
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
