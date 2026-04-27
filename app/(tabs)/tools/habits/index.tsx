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

import { IconGrid } from '@/components/icon-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TOOL_CATEGORIES, type ToolCategory } from '@/core/constants/todo-category';
import { UI_ICONS } from '@/core/constants/ui-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type HabitCard, selectHabitCards, useHabitStore } from '@/stores';

export default function HabitsScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

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
    return { done, total: habits.length };
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
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>习惯</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.subRow}>
          <View style={[styles.pill, { borderColor: cardBorder, backgroundColor: cardBg }]}>
            <ThemedText style={[styles.pillText, { color: mutedText }]}>
              今日完成：{stats.done}/{stats.total}
            </ThemedText>
          </View>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <HabitSwipeRow
            item={item}
            cardBg={cardBg}
            cardBorder={cardBorder}
            mutedText={mutedText}
            accent={accent}
            onEdit={openEditModal}
            onToggle={toggleTodayDone}
            onDelete={confirmDeleteHabit}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={openCreateModal}
        style={({ pressed }) => [styles.fab, { backgroundColor: accent, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.sheetMask} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheetMaskInner} />
        </Pressable>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.sheetKav}>
          <View style={[styles.sheet, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sheetTop}>
              <View style={styles.sheetHandle} />
            </View>

            <ThemedText style={styles.sheetTitle}>{editingId ? '编辑习惯' : '新建习惯'}</ThemedText>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: mutedText }]}>名称</ThemedText>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="例如：喝水（别装作你忘了）"
                  placeholderTextColor="#9F9A93"
                  style={[
                    styles.input,
                    { borderColor: cardBorder, color: '#3D3A36', backgroundColor: 'rgba(255,255,255,0.35)' },
                  ]}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: mutedText }]}>图标（单选）</ThemedText>
                <IconGrid icons={UI_ICONS} selectedId={formIconId} onSelect={setFormIconId} />
              </View>

              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: mutedText }]}>分类（单选）</ThemedText>
                <View style={styles.chips}>
                  {TOOL_CATEGORIES.map((category) => {
                    const active = category === formCategory;
                    return (
                      <Pressable
                        key={category}
                        onPress={() => setFormCategory(category)}
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? accent : cardBorder,
                            backgroundColor: active ? 'rgba(209,187,222,0.18)' : 'transparent',
                          },
                        ]}>
                        <ThemedText style={[styles.chipText, { color: active ? accent : mutedText }]}>{category}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.group}>
                <ThemedText style={[styles.groupLabel, { color: mutedText }]}>计划（可选）</ThemedText>
                <TextInput
                  value={formSchedule}
                  onChangeText={setFormSchedule}
                  placeholder="例如：每日 1 次 / 每周 3 次"
                  placeholderTextColor="#9F9A93"
                  style={[
                    styles.input,
                    { borderColor: cardBorder, color: '#3D3A36', backgroundColor: 'rgba(255,255,255,0.35)' },
                  ]}
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
              <Pressable onPress={() => setModalVisible(false)} style={[styles.actionBtn, { borderColor: cardBorder }]}>
                <ThemedText style={[styles.actionText, { color: mutedText }]}>取消</ThemedText>
              </Pressable>
              <Pressable onPress={saveHabit} style={[styles.actionBtn, { borderColor: accent, backgroundColor: accent }]}>
                <ThemedText style={[styles.actionText, { color: '#fff' }]}>保存</ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

type HabitSwipeRowProps = {
  item: HabitCard;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
  accent: string;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string, onConfirmed?: () => void) => void;
};

function HabitSwipeRow({ item, cardBg, cardBorder, mutedText, accent, onEdit, onToggle, onDelete }: HabitSwipeRowProps) {
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
            style={[styles.swipeAction, styles.checkAction, { backgroundColor: accent }]}>
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
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBubble, { borderColor: cardBorder }]}>
            <ThemedText style={styles.iconText}>
              {UI_ICONS.find((x) => x.id === (item.iconId ?? 'default'))?.label ?? UI_ICONS[0]?.label}
            </ThemedText>
          </View>
          <View style={styles.cardText}>
            <Pressable onPress={() => onEdit(item.id)}>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
            </Pressable>
            {item.schedule ? (
              <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>计划：{item.schedule}</ThemedText>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          <Pressable
            onPress={() => onToggle(item.id)}
            style={[
              styles.check,
              {
                borderColor: item.doneToday ? accent : cardBorder,
                backgroundColor: item.doneToday ? accent : 'transparent',
              },
            ]}>
            <ThemedText style={[styles.checkMark, { color: item.doneToday ? '#fff' : 'transparent' }]}>✓</ThemedText>
          </Pressable>
          <ThemedText style={[styles.streak, { color: mutedText }]}>连续 {item.streakDays} 天</ThemedText>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pill: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillText: { fontSize: 13, lineHeight: 16, fontWeight: '700' },
  listContent: { paddingTop: 6, paddingBottom: 150 },

  card: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
  iconBubble: { width: 34, height: 34, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, lineHeight: 20, fontWeight: '900' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '900', lineHeight: 22 },
  cardSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  check: { width: 28, height: 28, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 16, lineHeight: 16, fontWeight: '900', marginTop: -1 },
  streak: { fontSize: 12, lineHeight: 14, fontWeight: '700' },

  fab: { position: 'absolute', right: 18, bottom: 92, width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 34, lineHeight: 36, fontWeight: '900' },

  sheetMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetMaskInner: { flex: 1 },
  sheetKav: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { borderWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, paddingBottom: 16 },
  sheetTop: { alignItems: 'center', justifyContent: 'center', height: 26 },
  sheetHandle: { width: 44, height: 5, borderRadius: 999, backgroundColor: 'rgba(122,117,111,0.35)' },
  sheetTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  sheetContent: { paddingBottom: 10, gap: 12 },
  group: { gap: 8 },
  groupLabel: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  input: { height: 44, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6, paddingTop: 6 },
  actionBtn: { flex: 1, height: 42, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, lineHeight: 18, fontWeight: '900' },
  deleteBtn: { borderColor: '#D96C6C', backgroundColor: 'rgba(217,108,108,0.12)' },
  deleteText: { color: '#B84A4A' },
  swipeActionWrap: { width: 86, overflow: 'hidden' },
  leftActionWrap: { alignItems: 'flex-start' },
  rightActionWrap: { alignItems: 'flex-end' },
  swipeAction: { width: 76, minHeight: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  checkAction: {},
  deleteAction: { backgroundColor: '#D96C6C' },
  swipeActionText: { color: '#fff', fontSize: 13, lineHeight: 16, fontWeight: '900' },
});
