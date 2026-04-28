import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconGrid } from '@/components/icon-grid';
import { ThemedText } from '@/components/themed-text';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { TOOL_CATEGORIES, type ToolCategory } from '@/core/constants/todo-category';
import { UI_ICONS } from '@/core/constants/ui-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type HabitCard, selectHabitCards, useHabitStore } from '@/stores';

export default function HabitsScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const accent = palette.accent;
  const reportAccent = theme === 'light' ? '#6D8AAE' : '#88A9D4';
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listBottomPadding = tabBarHeight + insets.bottom + 88;
  const fabBottom = tabBarHeight + insets.bottom + uiTokens.spacing.xl;

  const habitsMap = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const habits = useMemo(() => selectHabitCards({ habits: habitsMap, logs } as any), [habitsMap, logs]);
  const toggleTodayDone = useHabitStore((s) => s.toggleTodayDone);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);

  const params = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formIconId, setFormIconId] = useState('default');
  const [formCategory, setFormCategory] = useState<ToolCategory>('自我');

  useEffect(() => {
    if (params?.create === '1') openCreateModal();
  }, [params?.create]);

  const stats = useMemo(() => {
    const done = habits.filter((h) => h.doneToday).length;
    const percent = habits.length === 0 ? 0 : Math.round((done / habits.length) * 100);
    return { done, total: habits.length, percent };
  }, [habits]);

  function openCreateModal() {
    setEditingId(null);
    setFormTitle('');
    setFormSchedule('');
    setFormIconId('default');
    setFormCategory('自我');
    setModalVisible(true);
  }

  function openEditModal(id: string) {
    const target = habits.find((h) => h.id === id);
    if (!target) return;
    setEditingId(target.id);
    setFormTitle(target.title);
    setFormSchedule(target.schedule ?? '');
    setFormIconId(target.iconId ?? 'default');
    setFormCategory(target.category ?? '自我');
    setModalVisible(true);
  }

  function saveHabit() {
    const trimmed = formTitle.trim();
    if (!trimmed) return;
    const schedule = formSchedule.trim() ? formSchedule.trim() : undefined;
    if (editingId) updateHabit(editingId, { title: trimmed, schedule, iconId: formIconId, category: formCategory });
    else addHabit({ title: trimmed, schedule, iconId: formIconId, category: formCategory });
    setModalVisible(false);
  }

  function confirmDeleteHabit(id: string, title: string, onConfirmed?: () => void) {
    Alert.alert('删除习惯？', `确定删除「${title}」吗？历史打卡记录也会一起清理。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          onConfirmed?.();
          removeHabit(id);
        },
      },
    ]);
  }

  return (
    <ScreenScaffold>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
          </Pressable>
          <View style={styles.titleWrap}>
            <ThemedText style={[styles.kicker, { color: reportAccent }]}>HABIT CHECKLIST</ThemedText>
            <ThemedText style={styles.bigTitle}>习惯</ThemedText>
          </View>
          <View style={{ width: 42 }} />
        </View>

        <SectionCard style={[styles.summaryCard, { borderColor: palette.border }]}>
          <View style={styles.summaryTop}>
            <ThemedText style={styles.summaryTitle}>今日打卡进度</ThemedText>
            <ThemedText style={[styles.summaryCount, { color: palette.muted }]}>{stats.done}/{stats.total}</ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: palette.input }]}>
            <View style={[styles.progressFill, { backgroundColor: reportAccent, width: `${stats.percent}%` }]} />
          </View>
          <ThemedText style={[styles.summaryHint, { color: palette.muted }]}>完成 {stats.percent}% · 连续感来自每天一点点。</ThemedText>
        </SectionCard>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: uiTokens.spacing.sm }} />}
        ListEmptyComponent={
          <SectionCard style={[styles.emptyCard, { backgroundColor: palette.input, borderColor: palette.border }]}>
            <ThemedText style={[styles.emptyMark, { color: reportAccent }]}>◇</ThemedText>
            <ThemedText style={[styles.emptyText, { color: palette.muted }]}>还没有习惯。先放一个很小、今天就能完成的动作。</ThemedText>
          </SectionCard>
        }
        renderItem={({ item }) => (
          <HabitSwipeRow
            item={item}
            cardBg={palette.cardAlt}
            cardBorder={palette.border}
            mutedText={palette.muted}
            accent={accent}
            reportAccent={reportAccent}
            onEdit={openEditModal}
            onToggle={toggleTodayDone}
            onDelete={confirmDeleteHabit}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={openCreateModal}
        style={({ pressed }) => [styles.fab, { backgroundColor: accent, bottom: fabBottom, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={[styles.sheetMask, { backgroundColor: palette.overlay }]} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheetMaskInner} />
        </Pressable>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.sheetKav}>
          <View style={[styles.sheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.sheetTop}>
              <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />
            </View>

            <View style={styles.sheetTitleWrap}>
              <ThemedText style={[styles.kicker, { color: reportAccent }]}>{editingId ? 'EDIT HABIT' : 'NEW HABIT'}</ThemedText>
              <ThemedText style={styles.sheetTitle}>{editingId ? '编辑习惯' : '新建习惯'}</ThemedText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: palette.muted }]}>名称</ThemedText>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="例如：喝水（别装作你忘了）"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: palette.muted }]}>图标（单选）</ThemedText>
                <IconGrid icons={UI_ICONS} selectedId={formIconId} onSelect={setFormIconId} />
              </View>

              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: palette.muted }]}>分类（单选）</ThemedText>
                <View style={styles.chips}>
                  {TOOL_CATEGORIES.map((category) => {
                    const active = category === formCategory;
                    return (
                      <AppChip
                        key={category}
                        title={category}
                        selected={active}
                        onPress={() => setFormCategory(category)}
                        style={active ? { borderColor: reportAccent, backgroundColor: 'rgba(109,138,174,0.14)' } : undefined}
                        textStyle={active ? { color: reportAccent } : undefined}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: palette.muted }]}>计划（可选）</ThemedText>
                <TextInput
                  value={formSchedule}
                  onChangeText={setFormSchedule}
                  placeholder="例如：每日 1 次 / 每周 3 次"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                  returnKeyType="done"
                />
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              {editingId ? (
                <Pressable
                  onPress={() => confirmDeleteHabit(editingId, formTitle.trim() || '这个习惯', () => setModalVisible(false))}
                  style={[styles.actionBtn, styles.deleteBtn]}>
                  <ThemedText style={[styles.actionText, styles.deleteText]}>删除</ThemedText>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setModalVisible(false)} style={[styles.actionBtn, { borderColor: palette.border }]}>
                <ThemedText style={[styles.actionText, { color: palette.muted }]}>取消</ThemedText>
              </Pressable>
              <Pressable onPress={saveHabit} style={[styles.actionBtn, { borderColor: accent, backgroundColor: accent }]}>
                <ThemedText style={[styles.actionText, { color: '#1D1B1E' }]}>保存</ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenScaffold>
  );
}

type HabitSwipeRowProps = {
  item: HabitCard;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
  accent: string;
  reportAccent: string;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string, onConfirmed?: () => void) => void;
};

function HabitSwipeRow({ item, cardBg, cardBorder, mutedText, accent, reportAccent, onEdit, onToggle, onDelete }: HabitSwipeRowProps) {
  const swipeRef = React.useRef<Swipeable>(null);
  const checkLabel = item.doneToday ? '取消打卡' : '打卡';

  return (
    <Swipeable
      ref={swipeRef}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <View style={[styles.swipeActionWrap, styles.leftActionWrap]}>
          <Pressable
            onPress={() => {
              swipeRef.current?.close();
              onToggle(item.id);
            }}
            style={[styles.swipeAction, { backgroundColor: accent }]}>
            <ThemedText style={styles.swipeActionText}>{checkLabel}</ThemedText>
          </Pressable>
        </View>
      )}
      renderRightActions={() => (
        <View style={[styles.swipeActionWrap, styles.rightActionWrap]}>
          <Pressable
            onPress={() => onDelete(item.id, item.title, () => swipeRef.current?.close())}
            style={[styles.swipeAction, styles.deleteAction]}>
            <ThemedText style={styles.swipeActionText}>删除</ThemedText>
          </Pressable>
        </View>
      )}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: item.doneToday ? accent : cardBorder }]}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBubble, { borderColor: item.doneToday ? accent : cardBorder }]}>
            <ThemedText style={styles.iconText}>
              {UI_ICONS.find((x) => x.id === (item.iconId ?? 'default'))?.label ?? UI_ICONS[0]?.label}
            </ThemedText>
          </View>
          <View style={styles.cardText}>
            <Pressable onPress={() => onEdit(item.id)} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
            </Pressable>
            <View style={styles.metaRow}>
              <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>{item.category ?? '未分类'}</ThemedText>
              <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>·</ThemedText>
              <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>{item.schedule ? `计划：${item.schedule}` : '未设置计划'}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Pressable
            onPress={() => onToggle(item.id)}
            style={[
              styles.check,
              {
                borderColor: item.doneToday ? accent : reportAccent,
                backgroundColor: item.doneToday ? accent : 'transparent',
              },
            ]}>
            <ThemedText style={[styles.checkMark, { color: item.doneToday ? '#1D1B1E' : 'transparent' }]}>✓</ThemedText>
          </Pressable>
          <ThemedText style={[styles.streak, { color: mutedText }]}>连续 {item.streakDays} 天</ThemedText>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, gap: uiTokens.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  titleWrap: { alignItems: 'center', gap: 2, flex: 1 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.1 },
  bigTitle: uiTokens.typography.pageTitle,
  backText: { ...uiTokens.typography.chip, width: 42 },
  summaryCard: { gap: uiTokens.spacing.sm },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: uiTokens.typography.cardTitle,
  summaryCount: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  summaryHint: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  progressTrack: { height: 10, borderRadius: uiTokens.radius.pill, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: uiTokens.radius.pill },
  listContent: { paddingTop: 2 },
  card: { borderWidth: 1, borderRadius: uiTokens.radius.lg, padding: uiTokens.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: uiTokens.spacing.md, flex: 1, paddingRight: uiTokens.spacing.sm },
  iconBubble: { width: 38, height: 38, borderRadius: uiTokens.radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 19, lineHeight: 22, fontWeight: '900' },
  cardText: { flex: 1, gap: 5 },
  cardTitle: { fontSize: 17, fontWeight: '900', lineHeight: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  cardSubtitle: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  cardRight: { alignItems: 'flex-end', gap: uiTokens.spacing.sm },
  check: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 16, lineHeight: 16, fontWeight: '900', marginTop: -1 },
  streak: { fontSize: 12, lineHeight: 14, fontWeight: '800' },
  fab: { position: 'absolute', right: uiTokens.layout.screenPaddingX, width: 58, height: 58, borderRadius: uiTokens.radius.lg, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#1D1B1E', fontSize: 34, lineHeight: 36, fontWeight: '900' },
  sheetMask: { flex: 1 },
  sheetMaskInner: { flex: 1 },
  sheetKav: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { borderWidth: 1, borderTopLeftRadius: uiTokens.radius.xl, borderTopRightRadius: uiTokens.radius.xl, padding: uiTokens.spacing.lg, paddingBottom: uiTokens.spacing.xl },
  sheetTop: { alignItems: 'center', justifyContent: 'center', height: 24 },
  sheetHandle: { width: 44, height: 5, borderRadius: uiTokens.radius.pill },
  sheetTitleWrap: { alignItems: 'center', gap: 2, marginBottom: uiTokens.spacing.md },
  sheetTitle: uiTokens.typography.cardTitle,
  sheetContent: { paddingBottom: uiTokens.spacing.sm, gap: uiTokens.spacing.md },
  group: { gap: uiTokens.spacing.sm },
  groupLabel: uiTokens.typography.chip,
  input: { height: 44, borderWidth: 1.5, borderRadius: uiTokens.radius.md, paddingHorizontal: uiTokens.spacing.md, fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
  sheetActions: { flexDirection: 'row', gap: uiTokens.spacing.sm, marginTop: uiTokens.spacing.sm, paddingTop: uiTokens.spacing.sm },
  actionBtn: { flex: 1, height: 42, borderWidth: 1.5, borderRadius: uiTokens.radius.md, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, lineHeight: 18, fontWeight: '900' },
  deleteBtn: { borderColor: uiTokens.colors.light.danger, backgroundColor: uiTokens.colors.light.dangerSoft },
  deleteText: { color: '#B84A4A' },
  swipeActionWrap: { width: 86, overflow: 'hidden' },
  leftActionWrap: { alignItems: 'flex-start' },
  rightActionWrap: { alignItems: 'flex-end' },
  swipeAction: { width: 76, minHeight: 76, borderRadius: uiTokens.radius.lg, alignItems: 'center', justifyContent: 'center' },
  deleteAction: { backgroundColor: uiTokens.colors.light.danger },
  swipeActionText: { color: '#fff', fontSize: 13, lineHeight: 16, fontWeight: '900' },
  emptyCard: { alignItems: 'center', marginTop: uiTokens.spacing.md },
  emptyMark: { fontSize: 24, lineHeight: 28, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
});
