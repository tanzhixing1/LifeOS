import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
const SOURCE_DETAIL_LABELS: Record<DailyTimelineRecord['source'], string> = {
  todo: '待办记录',
  habit: '习惯记录',
  schedule: '行程记录',
  manual: '手动记录',
};
const DEFAULT_MANUAL_CATEGORY = '日常';

type CalendarDay = {
  date: Date;
  dateISO: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
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

function getDefaultTimeInputValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatTimeInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseTimeInput(timeInput: string): { hours: number; minutes: number } | null {
  const match = timeInput.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function getManualOccurredAt(date: Date, timeInput: string): number {
  const parsed = parseTimeInput(timeInput) ?? { hours: 9, minutes: 0 };
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parsed.hours, parsed.minutes).getTime();
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
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
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
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualTime, setManualTime] = useState(() => getDefaultTimeInputValue());
  const [manualCategory, setManualCategory] = useState(DEFAULT_MANUAL_CATEGORY);
  const [manualNote, setManualNote] = useState('');
  const [manualFormError, setManualFormError] = useState('');
  const [editingRecord, setEditingRecord] = useState<DailyTimelineRecord | null>(null);

  const habitsMap = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const habits = useMemo(() => selectHabitCards({ habits: habitsMap, logs } as any), [habitsMap, logs]);

  const todoItems = useTodoStore((s) => s.items);
  const toggleTodo = useTodoStore((s) => s.toggle);
  const trigger = useMessengerStore((s) => s.trigger);
  const dailyTimelineRecords = useDailyTimelineStore((s) => s.records);
  const addDailyTimelineRecord = useDailyTimelineStore((s) => s.addRecord);
  const updateDailyTimelineRecord = useDailyTimelineStore((s) => s.updateRecord);
  const softDeleteDailyTimelineRecord = useDailyTimelineStore((s) => s.softDeleteRecord);

  const todayISO = useMemo(() => getLocalISODate(new Date()), []);
  const selectedDateISO = useMemo(() => getLocalISODate(selectedDate), [selectedDate]);

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
  const selectedTimelineTitle = useMemo(() => `${selectedDateLabel} · 星期${WEEKDAY_LABELS[selectedDate.getDay()]}`, [selectedDate, selectedDateLabel]);

  const calendarHintText = useMemo(() => {
    if (!isTimelineExpanded) {
      return selectedRecordCount > 0 ? `这天有 ${selectedRecordCount} 条生活记录，点击日期展开` : '这天还没有记录，点击日期展开';
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

  const openManualRecordModal = () => {
    setIsTimelineExpanded(true);
    setEditingRecord(null);
    setManualTitle('');
    setManualTime(getDefaultTimeInputValue());
    setManualCategory(DEFAULT_MANUAL_CATEGORY);
    setManualNote('');
    setManualFormError('');
    setManualModalVisible(true);
  };

  const openRecordEditor = (record: DailyTimelineRecord) => {
    setIsTimelineExpanded(true);
    setEditingRecord(record);
    setManualTitle(record.title);
    setManualTime(formatTimeInputValue(getTimelineTime(record)));
    setManualCategory(record.category ?? DEFAULT_MANUAL_CATEGORY);
    setManualNote(record.note ?? '');
    setManualFormError('');
    setManualModalVisible(true);
  };

  const closeManualRecordModal = () => {
    setManualModalVisible(false);
    setManualFormError('');
    setEditingRecord(null);
  };

  const saveManualRecord = () => {
    const title = manualTitle.trim();
    if (!title) {
      setManualFormError('先写一个标题');
      return;
    }

    const now = Date.now();
    const category = manualCategory.trim() || DEFAULT_MANUAL_CATEGORY;
    const note = manualNote.trim();
    const occurredAt = getManualOccurredAt(selectedDate, manualTime);

    if (editingRecord) {
      updateDailyTimelineRecord(editingRecord.id, {
        dateISO: selectedDateISO,
        occurredAt,
        deletedAt: null,
        title,
        category,
        note: note || undefined,
      });
      setManualModalVisible(false);
      setEditingRecord(null);
      setManualFormError('');
      setIsTimelineExpanded(true);
      return;
    }

    addDailyTimelineRecord({
      dateISO: selectedDateISO,
      occurredAt,
      createdAt: now,
      deletedAt: null,
      source: 'manual',
      title,
      category,
      note: note || undefined,
      kind: 'manual',
    });

    setManualTitle('');
    setManualTime(getDefaultTimeInputValue());
    setManualCategory(DEFAULT_MANUAL_CATEGORY);
    setManualNote('');
    setManualFormError('');
    setManualModalVisible(false);
    setEditingRecord(null);
    setIsTimelineExpanded(true);
  };

  const confirmDeleteEditingRecord = () => {
    if (!editingRecord) return;

    const isManual = editingRecord.source === 'manual';
    Alert.alert(isManual ? '删除记录？' : '隐藏记录？', isManual ? '确定删除这条手动记录吗？' : '确定从时间线隐藏这条记录吗？原待办或习惯不会被删除。', [
      { text: '取消', style: 'cancel' },
      {
        text: isManual ? '删除' : '隐藏',
        style: 'destructive',
        onPress: () => {
          softDeleteDailyTimelineRecord(editingRecord.id);
          setManualModalVisible(false);
          setEditingRecord(null);
          setManualFormError('');
          setIsTimelineExpanded(true);
        },
      },
    ]);
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
      <SectionCard elevated style={[styles.calendarCard, { borderColor: theme === 'light' ? 'rgba(209,187,222,0.42)' : 'rgba(228,203,242,0.16)' }]}>
        <View style={[styles.calendarTape, { backgroundColor: theme === 'light' ? '#FFF2BE' : 'rgba(209,187,222,0.16)' }]} />
        <View style={styles.calendarTop}>
          <View style={styles.calendarTitleBlock}>
            <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>DAILY TIMELINE</ThemedText>
            <ThemedText style={styles.calendarTitle}>
              {visibleMonth.getFullYear()}年 {visibleMonth.getMonth() + 1}月
            </ThemedText>
            <ThemedText style={[styles.calendarSubtitle, { color: palette.muted }]}>paper calendar</ThemedText>
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
          {Array.from({ length: 12 }, (_, index) => (
            <View key={index} style={[styles.calendarBindingDot, { borderColor: palette.border, backgroundColor: palette.card }]} />
          ))}
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <ThemedText key={label} style={[styles.weekdayText, index === 0 || index === 6 ? styles.weekendText : undefined, { color: palette.muted }]}>
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
                    : day.isWeekend && day.isCurrentMonth
                      ? palette.accentStrong
                      : day.isCurrentMonth
                      ? palette.text
                      : palette.muted;
                const hasRecords = day.recordCount > 0;
                const markerVariant =
                  day.isSelected && hasRecords
                    ? 'selected-record'
                    : day.isToday
                      ? 'today'
                      : hasRecords
                        ? 'record'
                        : null;
                const shouldShowMarker = markerVariant !== null;
                const markerColor =
                  markerVariant === 'today'
                    ? palette.accentStrong
                    : markerVariant === 'selected-record'
                      ? palette.accentStrong
                      : markerVariant === 'record'
                        ? 'rgba(150,144,138,0.78)'
                        : 'transparent';
                return (
                  <Pressable
                    key={day.dateISO}
                    onPress={() => selectCalendarDay(day)}
                    style={({ pressed }) => [styles.calendarDayCell, { opacity: pressed ? 0.75 : 1 }]}>
                    <View style={styles.calendarDayMarkerWrap}>
                      {day.isSelected ? (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.selectedScribble,
                            {
                              borderColor: palette.accentStrong,
                              backgroundColor: theme === 'light' ? 'rgba(209,187,222,0.03)' : 'rgba(228,203,242,0.08)',
                            },
                          ]}
                        />
                      ) : null}
                      <View
                        style={[
                          styles.calendarDayCircle,
                          {
                            backgroundColor: 'transparent',
                            borderColor: day.isSelected ? palette.accentStrong : 'transparent',
                            borderWidth: day.isSelected ? 2.4 : 1,
                            opacity: day.isCurrentMonth ? 1 : 0.34,
                            transform: [{ rotate: day.isSelected ? '-5deg' : '0deg' }, { scale: day.isSelected ? 1.03 : 1 }],
                            borderTopLeftRadius: day.isSelected ? 18 : 20,
                            borderTopRightRadius: day.isSelected ? 10 : 20,
                            borderBottomRightRadius: day.isSelected ? 18 : 20,
                            borderBottomLeftRadius: day.isSelected ? 10 : 20,
                          },
                        ]}>
                        <ThemedText style={[styles.calendarDayText, { color: dayTextColor }]}>{day.dayNumber}</ThemedText>
                        <View style={styles.calendarMarkerSlot}>
                          {shouldShowMarker ? <View style={[styles.calendarMarkerDot, { backgroundColor: markerColor }]} /> : null}
                        </View>
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
        <SectionCard elevated style={[styles.timelineCard, { borderColor: theme === 'light' ? 'rgba(216,208,199,0.16)' : 'rgba(42,48,54,0.28)' }]}>
          <View pointerEvents="none" style={[styles.timelineGlassSheen, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.035)' }]} />
          <View style={styles.sectionTop}>
            <View>
              <ThemedText style={[styles.briefMeta, { color: palette.muted }]}>SELECTED DAY</ThemedText>
              <View style={styles.timelineTitleRow}>
                <ThemedText style={styles.sectionTitle}>{selectedTimelineTitle}</ThemedText>
              </View>
            </View>
            <View style={styles.timelineHeaderActions}>
              <AppChip title="+ 添加" onPress={openManualRecordModal} />
            </View>
          </View>

          {selectedTimelineRecords.length === 0 ? (
            <View style={[styles.timelineEmpty, { backgroundColor: palette.input, borderColor: palette.border }]}>
              <View style={[styles.emptyPaperMark, { borderColor: palette.accent, backgroundColor: palette.card }]} />
              <View style={styles.timelineEmptyText}>
                <ThemedText style={styles.timelineEmptyTitle}>这天还没有记录</ThemedText>
                <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>完成待办、习惯打卡，或手动添加一条生活记录。</ThemedText>
                <AppButton title="添加一条记录" variant="outline" onPress={openManualRecordModal} style={styles.timelineEmptyAction} />
              </View>
            </View>
          ) : (
            <View style={styles.timelineList}>
              <View style={[styles.timelineRail, { backgroundColor: palette.accentSoft }]} />
              {selectedTimelineRecords.map((record) => (
                <View key={record.id} style={styles.timelineItem}>
                  <View style={styles.timelineAxisColumn}>
                    <ThemedText style={[styles.timelineTimeLabel, { color: palette.muted }]}>{formatTimelineTime(record)}</ThemedText>
                    <View style={[styles.timelineNode, { backgroundColor: palette.card, borderColor: palette.accentStrong }]} />
                  </View>
                  <Pressable
                    onPress={() => openRecordEditor(record)}
                    style={({ pressed }) => [
                      styles.timelineRecordCard,
                      {
                        backgroundColor: theme === 'light' ? 'rgba(255,252,246,0.62)' : 'rgba(255,255,255,0.05)',
                        borderColor: pressed ? palette.accentSoft : theme === 'light' ? 'rgba(216,208,199,0.18)' : 'rgba(255,255,255,0.08)',
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}>
                    <View style={styles.timelinePrimaryRow}>
                      <ThemedText style={styles.timelineTitle}>{record.title}</ThemedText>
                    </View>
                    <View style={styles.timelineMetaRow}>
                      {record.category ? (
                        <View style={[styles.timelineTag, { backgroundColor: theme === 'light' ? 'rgba(209,187,222,0.08)' : 'rgba(209,187,222,0.08)', borderColor: theme === 'light' ? 'rgba(139,111,161,0.08)' : 'rgba(228,203,242,0.08)' }]}>
                          <ThemedText style={[styles.timelineTagText, { color: palette.accentStrong }]}>{record.category}</ThemedText>
                        </View>
                      ) : null}
                      <View style={[styles.timelineTag, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.46)' : 'rgba(255,255,255,0.04)', borderColor: theme === 'light' ? 'rgba(216,208,199,0.14)' : 'rgba(255,255,255,0.08)' }]}>
                        <ThemedText style={[styles.timelineTagText, { color: palette.muted }]}>{SOURCE_LABELS[record.source]}</ThemedText>
                      </View>
                    </View>
                    {record.note ? (
                      <View style={[styles.timelineNoteShell, { backgroundColor: theme === 'light' ? 'rgba(247,240,234,0.42)' : 'rgba(255,255,255,0.03)' }]}>
                        <ThemedText numberOfLines={2} style={[styles.timelineNote, { color: palette.muted }]}>
                          {record.note}
                        </ThemedText>
                      </View>
                    ) : null}
                  </Pressable>
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

      <Modal visible={manualModalVisible} transparent animationType="slide" onRequestClose={closeManualRecordModal}>
        <Pressable style={[styles.sheetMask, { backgroundColor: palette.overlay }]} onPress={closeManualRecordModal}>
          <Pressable style={styles.sheetMaskInner} />
        </Pressable>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.sheetKav}>
          <View style={[styles.manualSheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.sheetTop}>
              <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />
            </View>

            <View style={styles.sheetTitleWrap}>
              <ThemedText style={[styles.briefMeta, { color: reportAccent }]}>{editingRecord ? 'TIMELINE RECORD' : 'MANUAL RECORD'}</ThemedText>
              <ThemedText style={styles.sheetTitle}>{editingRecord ? '编辑记录' : '添加生活记录'}</ThemedText>
              <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>{selectedDateLabel}</ThemedText>
              {editingRecord ? (
                <View style={[styles.sourcePill, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
                  <ThemedText style={[styles.sourcePillText, { color: palette.accentStrong }]}>{SOURCE_DETAIL_LABELS[editingRecord.source]}</ThemedText>
                </View>
              ) : null}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.manualForm}>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: palette.muted }]}>标题</ThemedText>
                <TextInput
                  value={manualTitle}
                  onChangeText={(value) => {
                    setManualTitle(value);
                    if (manualFormError) setManualFormError('');
                  }}
                  placeholder="例如：整理书桌"
                  placeholderTextColor={palette.muted}
                  style={[styles.formInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formRowItem]}>
                  <ThemedText style={[styles.formLabel, { color: palette.muted }]}>时间</ThemedText>
                  <TextInput
                    value={manualTime}
                    onChangeText={setManualTime}
                    placeholder="09:00"
                    placeholderTextColor={palette.muted}
                    style={[styles.formInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={[styles.formGroup, styles.formRowItem]}>
                  <ThemedText style={[styles.formLabel, { color: palette.muted }]}>分类</ThemedText>
                  <TextInput
                    value={manualCategory}
                    onChangeText={setManualCategory}
                    placeholder={DEFAULT_MANUAL_CATEGORY}
                    placeholderTextColor={palette.muted}
                    style={[styles.formInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                    returnKeyType="done"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: palette.muted }]}>备注</ThemedText>
                <TextInput
                  value={manualNote}
                  onChangeText={setManualNote}
                  placeholder="可选"
                  placeholderTextColor={palette.muted}
                  style={[styles.formInput, styles.noteInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {manualFormError ? <ThemedText style={[styles.formError, { color: palette.danger }]}>{manualFormError}</ThemedText> : null}
            </ScrollView>

            <View style={styles.sheetActions}>
              {editingRecord ? (
                <AppButton
                  title={editingRecord.source === 'manual' ? '删除' : '隐藏'}
                  variant="outline"
                  onPress={confirmDeleteEditingRecord}
                  style={[styles.sheetAction, { borderColor: palette.danger, backgroundColor: palette.dangerSoft }]}
                  textStyle={{ color: palette.danger }}
                />
              ) : null}
              <AppButton title="取消" variant="outline" onPress={closeManualRecordModal} style={styles.sheetAction} />
              <AppButton title="保存" onPress={saveManualRecord} style={styles.sheetAction} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: { gap: uiTokens.spacing.lg },
  briefMeta: { fontSize: 10, lineHeight: 13, fontWeight: '900', letterSpacing: 1 },
  calendarCard: {
    position: 'relative',
    overflow: 'visible',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 16,
    gap: uiTokens.spacing.md,
    borderRadius: uiTokens.radius.xl,
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  calendarTape: {
    position: 'absolute',
    top: -12,
    left: 22,
    width: 62,
    height: 24,
    borderRadius: 5,
    opacity: 0.72,
    transform: [{ rotate: '-5deg' }],
  },
  calendarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: uiTokens.spacing.md },
  calendarTitleBlock: { gap: 2 },
  calendarTitle: { fontSize: 26, lineHeight: 32, fontWeight: '900' },
  calendarSubtitle: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  monthControls: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  monthButton: { width: 34, height: 34, borderRadius: uiTokens.radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthButtonText: { fontSize: 24, lineHeight: 27, fontWeight: '900' },
  calendarBindingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: -4, marginBottom: 2, opacity: 0.72 },
  calendarBindingDot: { width: 6, height: 11, borderRadius: uiTokens.radius.pill, borderWidth: 1 },
  weekdayRow: { flexDirection: 'row', alignItems: 'center' },
  weekdayText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '900', textAlign: 'center' },
  weekendText: { opacity: 0.74 },
  calendarGrid: { gap: 3 },
  calendarWeekRow: { flexDirection: 'row', alignItems: 'center' },
  calendarDayCell: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  calendarDayMarkerWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  selectedScribble: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderWidth: 2.3,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 12,
    transform: [{ rotate: '-6deg' }],
  },
  calendarDayCircle: { width: 39, height: 39, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  calendarDayText: { fontSize: 18, lineHeight: 21, fontWeight: '900' },
  calendarMarkerSlot: { height: 7, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  calendarMarkerDot: { width: 5.5, height: 5.5, borderRadius: uiTokens.radius.pill },
  calendarHint: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: uiTokens.spacing.md,
  },
  calendarHintDate: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  calendarHintText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'right' },
  timelineCard: {
    gap: uiTokens.spacing.md,
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.012,
    shadowRadius: 10,
    elevation: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,252,247,0.38)',
    borderWidth: 1,
    borderRadius: uiTokens.radius.xl,
  },
  timelineGlassSheen: { ...StyleSheet.absoluteFillObject, opacity: 1 },
  timelineTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
  timelineCountPill: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 2 },
  timelineCountText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  timelineHeaderActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: uiTokens.spacing.sm },
  timelineEmpty: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    padding: uiTokens.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: uiTokens.spacing.md,
  },
  emptyPaperMark: { width: 18, height: 18, borderRadius: uiTokens.radius.pill, borderWidth: 2 },
  timelineEmptyText: { flex: 1, gap: 2 },
  timelineEmptyTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900' },
  timelineEmptyAction: { alignSelf: 'flex-start', minHeight: 38, marginTop: uiTokens.spacing.sm, borderRadius: uiTokens.radius.md },
  timelineList: { gap: uiTokens.spacing.md, position: 'relative', paddingLeft: 0, paddingRight: uiTokens.spacing.sm },
  timelineRail: { position: 'absolute', left: 45, top: 12, bottom: 12, width: 1, borderRadius: uiTokens.radius.pill },
  timelineItem: { flexDirection: 'row', gap: uiTokens.spacing.sm, alignItems: 'flex-start', paddingRight: uiTokens.spacing.xs },
  timelineAxisColumn: { width: 50, alignItems: 'flex-end', paddingTop: 2, paddingRight: 4 },
  timelineTimeLabel: { width: 36, fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 0.1, marginBottom: 4, textAlign: 'right' },
  timelineNode: { width: 8, height: 8, borderRadius: uiTokens.radius.pill, borderWidth: 1.5, zIndex: 1 },
  timelineRecordCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    gap: uiTokens.spacing.xs,
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.014,
    shadowRadius: 6,
    elevation: 0,
  },
  timelinePrimaryRow: { flexDirection: 'row', alignItems: 'center', gap: uiTokens.spacing.xs },
  timelineMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: uiTokens.spacing.xs },
  timelineTag: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  timelineTagText: { fontSize: 10, lineHeight: 13, fontWeight: '900' },
  timelineTitle: { fontSize: 16, lineHeight: 21, fontWeight: '900' },
  timelineNoteShell: {
    borderRadius: uiTokens.radius.md,
    paddingHorizontal: uiTokens.spacing.sm,
    paddingVertical: 6,
  },
  timelineNote: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  sheetMask: { flex: 1 },
  sheetMaskInner: { flex: 1 },
  sheetKav: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  manualSheet: {
    borderWidth: 1,
    borderTopLeftRadius: uiTokens.radius.xl,
    borderTopRightRadius: uiTokens.radius.xl,
    paddingHorizontal: uiTokens.spacing.lg,
    paddingTop: uiTokens.spacing.md,
    paddingBottom: uiTokens.spacing.xl,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  sheetTop: { alignItems: 'center', justifyContent: 'center', height: 24 },
  sheetHandle: { width: 44, height: 5, borderRadius: uiTokens.radius.pill },
  sheetTitleWrap: { alignItems: 'center', gap: 3, marginBottom: uiTokens.spacing.md },
  sheetTitle: { fontSize: 18, lineHeight: 23, fontWeight: '900' },
  sourcePill: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 3, marginTop: uiTokens.spacing.xs },
  sourcePillText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  manualForm: { gap: uiTokens.spacing.md, paddingBottom: uiTokens.spacing.sm },
  formGroup: { gap: uiTokens.spacing.sm },
  formRow: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  formRowItem: { flex: 1 },
  formLabel: uiTokens.typography.chip,
  formInput: {
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: uiTokens.radius.lg,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    fontSize: 15,
    fontWeight: '800',
  },
  noteInput: { minHeight: 82 },
  formError: { fontSize: 12, lineHeight: 17, fontWeight: '900' },
  sheetActions: { flexDirection: 'row', gap: uiTokens.spacing.sm, marginTop: uiTokens.spacing.sm, paddingTop: uiTokens.spacing.sm },
  sheetAction: { flex: 1 },
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
