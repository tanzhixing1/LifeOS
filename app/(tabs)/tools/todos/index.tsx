import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoCreateModal } from '@/components/todo-create-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UI_ICONS } from '@/core/constants/ui-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type Todo, useTodoStore } from '@/stores';

type TodoFilter = 'all' | 'active' | 'done';

const TODO_FILTER_OPTIONS: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '待办' },
  { value: 'done', label: '已完成' },
];

export default function TodosScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#252A31' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listBottomPadding = tabBarHeight + insets.bottom + 40;

  const params = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>('active');

  const items = useTodoStore((s) => s.items) as Pick<Todo, 'id' | 'title' | 'dueAt' | 'category' | 'iconId' | 'done'>[];
  const toggleStore = useTodoStore((s) => s.toggle);
  const removeTodo = useTodoStore((s) => s.removeTodo);

  useEffect(() => {
    if (params?.create === '1') openCreateModal();
  }, [params?.create]);

  const iconsById = useMemo(() => new Map(UI_ICONS.map((i) => [i.id, i.label])), []);
  function formatDueAt(dueAt: number | null) {
    if (!dueAt) return '无截止';
    const d = new Date(dueAt);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${hh}:${mm}`;
  }

  const stats = useMemo(() => {
    const done = items.filter((x) => x.done).length;
    return { done, total: items.length };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'active') return items.filter((x) => !x.done);
    if (filter === 'done') return items.filter((x) => x.done);
    return items;
  }, [filter, items]);

  const editingTodo = useMemo(() => items.find((x) => x.id === editingId) ?? null, [editingId, items]);

  function openCreateModal() {
    setEditingId(null);
    setModalVisible(true);
  }

  function openEditModal(id: string) {
    setEditingId(id);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingId(null);
  }

  function confirmDeleteTodo(id: string, title: string, onConfirmed?: () => void) {
    Alert.alert('删除待办？', `确定删除「${title}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          onConfirmed?.();
          removeTodo(id);
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
          <ThemedText style={styles.bigTitle}>待办</ThemedText>
          <Pressable
            onPress={openCreateModal}
            style={({ pressed }) => [
              styles.addChip,
              { borderColor: accent, opacity: pressed ? 0.9 : 1 },
            ]}>
            <ThemedText style={[styles.addChipText, { color: accent }]}>+ 新建</ThemedText>
          </Pressable>
        </View>
        <View style={styles.subRow}>
          <ThemedText style={[styles.hint, { color: mutedText }]}>
            今日完成：{stats.done}/{stats.total}（点一行就算你做了）
          </ThemedText>
        </View>
        <View style={styles.filterRow}>
          {TODO_FILTER_OPTIONS.map((option) => {
            const isActive = option.value === filter;

            return (
              <Pressable
                key={option.value}
                onPress={() => setFilter(option.value)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? accent : 'transparent',
                    borderColor: isActive ? accent : cardBorder,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}>
                <ThemedText style={[styles.filterChipText, { color: isActive ? '#171819' : mutedText }]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TodoSwipeRow
            item={item}
            cardBg={cardBg}
            cardBorder={cardBorder}
            mutedText={mutedText}
            accent={accent}
            iconLabel={iconsById.get(item.iconId) ?? iconsById.get('default') ?? ''}
            dueLabel={formatDueAt(item.dueAt)}
            onEdit={openEditModal}
            onToggle={toggleStore}
            onDelete={confirmDeleteTodo}
          />
        )}
      />

      <TodoCreateModal visible={modalVisible} onRequestClose={closeModal} editingTodo={editingTodo} onCreated={() => {}} />
    </ThemedView>
  );
}

type TodoListItem = Pick<Todo, 'id' | 'title' | 'dueAt' | 'category' | 'iconId' | 'done'>;

type TodoSwipeRowProps = {
  item: TodoListItem;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
  accent: string;
  iconLabel: string;
  dueLabel: string;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string, onConfirmed?: () => void) => void;
};

function TodoSwipeRow({ item, cardBg, cardBorder, mutedText, accent, iconLabel, dueLabel, onEdit, onToggle, onDelete }: TodoSwipeRowProps) {
  const swipeRef = React.useRef<Swipeable>(null);
  const toggleLabel = item.done ? '取消完成' : '完成';

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
            <ThemedText style={styles.swipeActionText}>{toggleLabel}</ThemedText>
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
      <Pressable
        onPress={() => onEdit(item.id)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
        ]}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.dot,
              { backgroundColor: item.done ? accent : 'transparent', borderColor: item.done ? accent : cardBorder },
            ]}
          />
          <View style={[styles.iconBubble, { borderColor: cardBorder }]}>
            <ThemedText style={styles.iconText}>{iconLabel}</ThemedText>
          </View>
          <View style={styles.cardText}>
            <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>
              {dueLabel} · {item.category}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.status, { color: item.done ? accent : mutedText }]}>{item.done ? '已完成' : '待办'}</ThemedText>
      </Pressable>
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
  hint: { fontSize: 13, lineHeight: 16, fontWeight: '700' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: { flex: 1, borderWidth: 1.5, borderRadius: 999, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  filterChipText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  addChip: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  addChipText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  listContent: { paddingTop: 6, paddingBottom: 18 },

  card: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 6, borderWidth: 2 },
  iconBubble: { width: 34, height: 34, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, lineHeight: 20, fontWeight: '900' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '900', lineHeight: 22 },
  cardSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  status: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  swipeActionWrap: { width: 86, overflow: 'hidden' },
  leftActionWrap: { alignItems: 'flex-start' },
  rightActionWrap: { alignItems: 'flex-end' },
  swipeAction: { width: 76, minHeight: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  deleteAction: { backgroundColor: '#D96C6C' },
  swipeActionText: { color: '#fff', fontSize: 13, lineHeight: 16, fontWeight: '900' },
});
