import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoCreateModal } from '@/components/todo-create-modal';
import { ThemedText } from '@/components/themed-text';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { UI_ICONS } from '@/core/constants/ui-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type Todo, useTodoStore } from '@/stores';

type TodoFilter = 'all' | 'active' | 'done';

const TODO_FILTER_OPTIONS: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '待办' },
  { value: 'done', label: '已完成' },
];

export default function TodosScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const accent = palette.accent;
  const reportAccent = theme === 'light' ? '#6D8AAE' : '#88A9D4';
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listBottomPadding = tabBarHeight + insets.bottom + uiTokens.layout.tabBarExtraPadding;

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
    const active = items.length - done;
    return { active, done, total: items.length };
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
    <ScreenScaffold>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
          </Pressable>
          <View style={styles.titleWrap}>
            <ThemedText style={[styles.kicker, { color: reportAccent }]}>TASK LIST</ThemedText>
            <ThemedText style={styles.bigTitle}>待办</ThemedText>
          </View>
          <AppChip title="+ 新建" onPress={openCreateModal} style={styles.addChip} />
        </View>

        <View style={[styles.summaryStrip, { borderColor: palette.border, backgroundColor: palette.input }]}>
          <ThemedText style={[styles.summaryText, { color: palette.muted }]}>未完成 {stats.active}</ThemedText>
          <View style={[styles.summaryDot, { backgroundColor: palette.border }]} />
          <ThemedText style={[styles.summaryText, { color: palette.muted }]}>已完成 {stats.done}</ThemedText>
          <View style={[styles.summaryDot, { backgroundColor: palette.border }]} />
          <ThemedText style={[styles.summaryText, { color: palette.muted }]}>总计 {stats.total}</ThemedText>
        </View>

        <View style={styles.filterRow}>
          {TODO_FILTER_OPTIONS.map((option) => (
            <AppChip
              key={option.value}
              title={option.label}
              selected={option.value === filter}
              onPress={() => setFilter(option.value)}
              style={styles.filterChip}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: uiTokens.spacing.sm }} />}
        ListEmptyComponent={
          <EmptyTaskState
            accent={reportAccent}
            mutedText={palette.muted}
            borderColor={palette.border}
            backgroundColor={palette.input}
            filter={filter}
          />
        }
        renderItem={({ item }) => (
          <TodoSwipeRow
            item={item}
            cardBg={palette.cardAlt}
            cardBorder={palette.border}
            mutedText={palette.muted}
            accent={accent}
            reportAccent={reportAccent}
            iconLabel={iconsById.get(item.iconId) ?? iconsById.get('default') ?? ''}
            dueLabel={formatDueAt(item.dueAt)}
            onEdit={openEditModal}
            onToggle={toggleStore}
            onDelete={confirmDeleteTodo}
          />
        )}
      />

      <TodoCreateModal visible={modalVisible} onRequestClose={closeModal} editingTodo={editingTodo} onCreated={() => {}} />
    </ScreenScaffold>
  );
}

type TodoListItem = Pick<Todo, 'id' | 'title' | 'dueAt' | 'category' | 'iconId' | 'done'>;

type TodoSwipeRowProps = {
  item: TodoListItem;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
  accent: string;
  reportAccent: string;
  iconLabel: string;
  dueLabel: string;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string, onConfirmed?: () => void) => void;
};

function TodoSwipeRow({ item, cardBg, cardBorder, mutedText, accent, reportAccent, iconLabel, dueLabel, onEdit, onToggle, onDelete }: TodoSwipeRowProps) {
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
          { backgroundColor: cardBg, borderColor: item.done ? accent : cardBorder, opacity: pressed ? 0.92 : 1 },
        ]}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.dot,
              { backgroundColor: item.done ? accent : 'transparent', borderColor: item.done ? accent : reportAccent },
            ]}
          />
          <View style={[styles.iconBubble, { borderColor: cardBorder }]}>
            <ThemedText style={styles.iconText}>{iconLabel}</ThemedText>
          </View>
          <View style={styles.cardText}>
            <ThemedText style={[styles.cardTitle, item.done ? styles.doneTitle : undefined]}>{item.title}</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>
              {dueLabel} · {item.category}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.statusPill, { borderColor: item.done ? accent : cardBorder }]}>
          <ThemedText style={[styles.status, { color: item.done ? accent : mutedText }]}>{item.done ? '已完成' : '待办'}</ThemedText>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function EmptyTaskState({
  accent,
  mutedText,
  borderColor,
  backgroundColor,
  filter,
}: {
  accent: string;
  mutedText: string;
  borderColor: string;
  backgroundColor: string;
  filter: TodoFilter;
}) {
  const message = filter === 'done' ? '还没有完成记录。先完成一件小事，给今天留个证据。' : '这里暂时很清爽。可以新建一件真正要做的小事。';
  return (
    <SectionCard style={[styles.emptyCard, { borderColor, backgroundColor }]}>
      <ThemedText style={[styles.emptyMark, { color: accent }]}>◇</ThemedText>
      <ThemedText style={[styles.emptyText, { color: mutedText }]}>{message}</ThemedText>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, gap: uiTokens.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  titleWrap: { alignItems: 'center', gap: 2, flex: 1 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.1 },
  bigTitle: uiTokens.typography.pageTitle,
  backText: { ...uiTokens.typography.chip, width: 42 },
  addChip: { width: 68, paddingHorizontal: 0 },
  summaryStrip: { borderWidth: 1, borderRadius: uiTokens.radius.md, paddingVertical: uiTokens.spacing.sm, paddingHorizontal: uiTokens.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: uiTokens.spacing.sm },
  summaryText: { fontSize: 12, lineHeight: 16, fontWeight: '900' },
  summaryDot: { width: 4, height: 4, borderRadius: uiTokens.radius.pill },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: uiTokens.spacing.sm },
  filterChip: { flex: 1 },
  listContent: { paddingTop: 2 },
  card: { borderWidth: 1, borderRadius: uiTokens.radius.lg, padding: uiTokens.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: uiTokens.spacing.md, flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 6, borderWidth: 2 },
  iconBubble: { width: 34, height: 34, borderRadius: uiTokens.radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, lineHeight: 20, fontWeight: '900' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '900', lineHeight: 22 },
  doneTitle: { opacity: 0.62, textDecorationLine: 'line-through' },
  cardSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  statusPill: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 5 },
  status: { fontSize: 12, lineHeight: 14, fontWeight: '900' },
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
