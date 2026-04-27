import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { TodoCreateModal } from '@/components/todo-create-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UI_ICONS } from '@/core/constants/ui-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type Todo, useTodoStore } from '@/stores';

export default function TodosScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#252A31' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const params = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);

  const items = useTodoStore((s) => s.items) as Pick<Todo, 'id' | 'title' | 'dueAt' | 'category' | 'iconId' | 'done'>[];
  const toggleStore = useTodoStore((s) => s.toggle);
  const addTodo = useTodoStore((s) => s.addTodo);

  useEffect(() => {
    if (params?.create === '1') setModalVisible(true);
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

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>待办</ThemedText>
          <Pressable
            onPress={() => setModalVisible(true)}
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
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleStore(item.id)}
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
                <ThemedText style={styles.iconText}>{iconsById.get(item.iconId) ?? iconsById.get('default')}</ThemedText>
              </View>
              <View style={styles.cardText}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>
                  {formatDueAt(item.dueAt)} · {item.category}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.status, { color: item.done ? accent : mutedText }]}>{item.done ? '已完成' : '待办'}</ThemedText>
          </Pressable>
        )}
      />

      <TodoCreateModal visible={modalVisible} onRequestClose={() => setModalVisible(false)} onCreated={() => {}} />
    </ThemedView>
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
});
